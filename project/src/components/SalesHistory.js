import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Search, Calendar, DollarSign, Package, X } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { formatCurrency, getTodayDate, getStartOfDay, getEndOfDay } from '../utils/helpers';

const SalesHistory = React.memo(() => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [filterDate, setFilterDate] = useState(getTodayDate());

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const startOfDay = getStartOfDay(filterDate);
    const endOfDay = getEndOfDay(filterDate);

    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales:', error);
      setError('Error al cargar el historial de ventas: ' + error.message);
    } else {
      setSales(data);
    }
    setLoading(false);
  }, [filterDate]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const fetchSaleItems = useCallback(async (saleId) => {
    const { data, error } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId);
    if (error) {
      console.error('Error fetching sale items:', error);
      return [];
    }
    return data;
  }, []);

  const handleViewDetails = useCallback(async (sale) => {
    const items = await fetchSaleItems(sale.id);
    setSelectedSale({ ...sale, items });
  }, [fetchSaleItems]);

  const handleCloseDetails = useCallback(() => {
    setSelectedSale(null);
  }, []);

  const filteredSales = useMemo(() => {
    if (!searchTerm) {
      return sales;
    }
    return sales.filter(sale =>
      sale.sold_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.total_amount.toString().includes(searchTerm)
    );
  }, [sales, searchTerm]);

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
        <p className="ml-4 text-gray-600">Cargando historial de ventas...</p>
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
        <History size={28} className="text-orange-400" />
        Historial de Ventas
      </h2>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center bg-gray-100 rounded-xl p-3 shadow-inner flex-grow">
          <Search className="text-gray-500 mr-3" size={24} />
          <input
            type="text"
            placeholder="Buscar venta por ID o vendedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500 text-lg"
          />
        </div>
        <div className="flex items-center bg-gray-100 rounded-xl p-3 shadow-inner">
          <Calendar className="text-gray-500 mr-3" size={24} />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-transparent outline-none text-gray-800 text-lg"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        <div className="space-y-3">
          <AnimatePresence>
            {filteredSales.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 text-gray-500"
              >
                <p className="font-medium">No hay ventas para la fecha seleccionada o que coincidan con la búsqueda.</p>
              </motion.div>
            ) : (
              filteredSales.map((sale) => (
                <motion.div
                  key={sale.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-medium text-gray-800">Venta ID: {sale.id.substring(0, 8)}...</h4>
                    <p className="text-sm text-gray-600">Vendedor: {sale.sold_by}</p>
                    <p className="text-xs text-gray-400">{new Date(sale.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-green-500">{formatCurrency(sale.total_amount)}</span>
                    <motion.button
                      onClick={() => handleViewDetails(sale)}
                      className="bg-blue-400 text-white px-3 py-1 rounded-lg hover:bg-blue-500 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Ver Detalles
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedSale && (
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
                <h3 className="text-xl font-bold text-gray-800">Detalles de Venta: {selectedSale.id.substring(0, 8)}...</h3>
                <motion.button
                  onClick={handleCloseDetails}
                  className="text-gray-500 hover:text-gray-700"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={24} />
                </motion.button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                <p className="text-gray-700 mb-2"><strong>Fecha:</strong> {new Date(selectedSale.created_at).toLocaleString()}</p>
                <p className="text-gray-700 mb-2"><strong>Vendedor:</strong> {selectedSale.sold_by}</p>
                <p className="text-gray-700 mb-4"><strong>Total:</strong> {formatCurrency(selectedSale.total_amount)}</p>

                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Package size={20} /> Productos Vendidos:
                </h4>
                {selectedSale.items && selectedSale.items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSale.items.map(item => (
                      <div key={item.id} className="bg-gray-100 p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{item.product_name}</p>
                          <p className="text-sm text-gray-600">{formatCurrency(item.price_at_sale)} x {item.quantity}</p>
                        </div>
                        <span className="font-bold text-gray-800">{formatCurrency(item.total_item_price)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay productos asociados a esta venta.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default SalesHistory;