import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, History, Box, PlusCircle, MinusCircle, X, Download } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { formatCurrency } from '../utils/helpers';
import { exportToExcel } from '../utils/excelExport';

const InventoryManagement = React.memo(() => {
  const [products, setProducts] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductForLogs, setSelectedProductForLogs] = useState(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentDetails, setAdjustmentDetails] = useState({
    productId: '',
    productName: '',
    type: 'entrada',
    quantity: '',
    reason: ''
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
    if (error) {
      console.error('Error fetching products:', error);
      setError('Error al cargar productos: ' + error.message);
    } else {
      setProducts(data);
    }
    setLoading(false);
  }, []);

  const fetchInventoryLogs = useCallback(async (productId = null) => {
    setLoading(true);
    setError(null);
    let query = supabase.from('inventory_logs').select('*').order('created_at', { ascending: false });
    if (productId) {
      query = query.eq('product_id', productId);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching inventory logs:', error);
      setError('Error al cargar el historial de inventario: ' + error.message);
    } else {
      setInventoryLogs(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchInventoryLogs();
  }, [fetchProducts, fetchInventoryLogs]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleViewLogs = useCallback((product) => {
    setSelectedProductForLogs(product);
    fetchInventoryLogs(product.id);
  }, [fetchInventoryLogs]);

  const handleCloseLogs = useCallback(() => {
    setSelectedProductForLogs(null);
    setInventoryLogs([]);
    fetchInventoryLogs(); // Fetch all logs again
  }, [fetchInventoryLogs]);

  const handleOpenAdjustmentModal = useCallback((product) => {
    setAdjustmentDetails({
      productId: product.id,
      productName: product.name,
      type: 'entrada',
      quantity: '',
      reason: ''
    });
    setShowAdjustmentModal(true);
  }, []);

  const handleAdjustmentChange = useCallback((e) => {
    const { name, value } = e.target;
    setAdjustmentDetails(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAdjustStock = useCallback(async (e) => {
    e.preventDefault();
    const { productId, productName, type, quantity, reason } = adjustmentDetails;

    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      alert('Por favor, introduce una cantidad válida para el ajuste.');
      return;
    }

    const currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) {
      alert('Producto no encontrado.');
      return;
    }

    let newStock = currentProduct.stock;
    const parsedQuantity = parseInt(quantity, 10);

    if (type === 'entrada') {
      newStock += parsedQuantity;
    } else if (type === 'salida') {
      newStock -= parsedQuantity;
    } else if (type === 'ajuste') {
      newStock = parsedQuantity; // For 'ajuste', quantity is the new stock level
    }

    if (newStock < 0) {
      alert('El stock no puede ser negativo.');
      return;
    }

    const { data, error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)
      .select()
      .single();

    if (updateError) {
      console.error('Error adjusting stock:', updateError);
      alert('Error al ajustar el stock: ' + updateError.message);
      return;
    }

    const { error: logError } = await supabase
      .from('inventory_logs')
      .insert({
        product_id: productId,
        product_name: productName,
        change_type: type,
        quantity_change: parsedQuantity,
        new_stock: newStock,
        reason: reason || `Ajuste de stock: ${type}`
      });

    if (logError) console.error('Error logging inventory:', logError);

    setShowAdjustmentModal(false);
    setAdjustmentDetails({ productId: '', productName: '', type: 'entrada', quantity: '', reason: '' });
    fetchProducts(); // Refresh product list
    fetchInventoryLogs(selectedProductForLogs ? selectedProductForLogs.id : null); // Refresh logs
    alert('Stock ajustado con éxito.');
  }, [adjustmentDetails, products, selectedProductForLogs, fetchProducts, fetchInventoryLogs]);

  const handleExportInventory = useCallback(() => {
    const dataToExport = products.map(p => ({
      ID: p.id,
      Nombre: p.name,
      Precio: p.price,
      Categoría: p.category,
      Stock: p.stock,
      'URL Imagen': p.image_url,
      'Fecha Creación': new Date(p.created_at).toLocaleString(),
      'Última Actualización': new Date(p.updated_at).toLocaleString()
    }));
    exportToExcel(dataToExport, 'Inventario_Reporte', 'Inventario');
  }, [products]);

  if (loading) {
    return (
      <motion.div
        className="bg-white rounded-xl shadow-lg p-6 h-full flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="ml-4 text-gray-600">Cargando inventario...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="bg-white rounded-xl shadow-lg p-6 h-full flex items-center justify-center text-red-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p>{error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Package size={28} className="text-green-400" />
        Gestión de Inventario
      </h2>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center bg-gray-100 rounded-xl p-3 shadow-inner flex-grow">
          <Search className="text-gray-500 mr-3" size={24} />
          <input
            type="text"
            placeholder="Buscar producto por nombre o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500 text-lg"
          />
        </div>
        <motion.button
          onClick={handleExportInventory}
          className="bg-green-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-500 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download size={18} />
          Exportar a Excel
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        <div className="space-y-3">
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                  <div>
                    <h4 className="font-medium text-gray-800">{product.name}</h4>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(product.price)} | Stock: <span className="font-bold">{product.stock}</span>
                    </p>
                    <p className="text-xs text-gray-400">Categoría: {product.category}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => handleOpenAdjustmentModal(product)}
                    className="text-blue-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Box size={20} />
                  </motion.button>
                  <motion.button
                    onClick={() => handleViewLogs(product)}
                    className="text-purple-500 hover:text-purple-600 p-2 rounded-full hover:bg-purple-100 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <History size={20} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedProductForLogs && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl h-3/4 flex flex-col"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
            >
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-xl font-bold text-gray-800">Historial de Inventario: {selectedProductForLogs.name}</h3>
                <motion.button
                  type="button"
                  onClick={handleCloseLogs}
                  className="text-gray-500 hover:text-gray-700"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={24} />
                </motion.button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                {inventoryLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">No hay registros de inventario para este producto.</p>
                ) : (
                  <div className="space-y-3">
                    {inventoryLogs.map(log => (
                      <div key={log.id} className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center text-sm font-medium text-gray-800">
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                          <span className={`font-bold ${log.change_type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {log.change_type === 'entrada' ? '+' : '-'}{log.quantity_change}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">Nuevo Stock: {log.new_stock}</p>
                        <p className="text-xs text-gray-500">Razón: {log.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdjustmentModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              onSubmit={handleAdjustStock}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
            >
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-xl font-bold text-gray-800">Ajustar Stock: {adjustmentDetails.productName}</h3>
                <motion.button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={24} />
                </motion.button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Tipo de Ajuste:</label>
                  <select
                    name="type"
                    value={adjustmentDetails.type}
                    onChange={handleAdjustmentChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="entrada">Entrada (Añadir)</option>
                    <option value="salida">Salida (Restar)</option>
                    <option value="ajuste">Ajuste (Establecer a)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Cantidad:</label>
                  <input
                    type="number"
                    name="quantity"
                    value={adjustmentDetails.quantity}
                    onChange={handleAdjustmentChange}
                    min="1"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Razón:</label>
                  <textarea
                    name="reason"
                    value={adjustmentDetails.reason}
                    onChange={handleAdjustmentChange}
                    placeholder="Ej: Inventario inicial, daño, robo, etc."
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <motion.button
                  type="submit"
                  className="w-full bg-blue-400 text-white py-2 rounded-lg hover:bg-blue-500 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Guardar Ajuste
                </motion.button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default InventoryManagement;