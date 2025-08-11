import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, PlusCircle, Edit, Trash2, Search, Box, Image, DollarSign, Tag, Hash } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { formatCurrency } from '../utils/helpers';

const AdminPanel = React.memo(({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    image_url: ''
  });
  const [editedProduct, setEditedProduct] = useState({
    id: null,
    name: '',
    price: '',
    category: '',
    stock: '',
    image_url: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAddSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.category || newProduct.stock === '') {
      alert('Por favor, rellena todos los campos obligatorios.');
      return;
    }
    await onAddProduct({
      ...newProduct,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock, 10)
    });
    setNewProduct({ name: '', price: '', category: '', stock: '', image_url: '' });
    setIsAdding(false);
  }, [newProduct, onAddProduct]);

  const handleEditClick = useCallback((product) => {
    setEditingProductId(product.id);
    setEditedProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock,
      image_url: product.image_url
    });
  }, []);

  const handleEditChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditedProduct(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editedProduct.name || !editedProduct.price || !editedProduct.category || editedProduct.stock === '') {
      alert('Por favor, rellena todos los campos obligatorios.');
      return;
    }
    await onUpdateProduct(editedProduct.id, {
      name: editedProduct.name,
      price: parseFloat(editedProduct.price),
      category: editedProduct.category,
      stock: parseInt(editedProduct.stock, 10),
      image_url: editedProduct.image_url
    });
    setEditingProductId(null);
  }, [editedProduct, onUpdateProduct]);

  const handleCancelEdit = useCallback(() => {
    setEditingProductId(null);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Settings size={28} className="text-indigo-400" />
        Panel de Administración
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
          onClick={() => { setIsAdding(!isAdding); setEditingProductId(null); }}
          className="bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-500 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlusCircle size={18} />
          {isAdding ? 'Cancelar' : 'Añadir Producto'}
        </motion.button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleAddSubmit}
            className="bg-gray-100 p-4 rounded-lg mb-6 space-y-3 overflow-hidden"
          >
            <h4 className="font-semibold text-gray-700">Nuevo Producto</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <Tag size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  placeholder="Nombre del producto *"
                  value={newProduct.name}
                  onChange={handleAddChange}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="relative">
                <DollarSign size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="price"
                  placeholder="Precio *"
                  value={newProduct.price}
                  onChange={handleAddChange}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                  step="0.01"
                  required
                />
              </div>
              <div className="relative">
                <Box size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="category"
                  placeholder="Categoría *"
                  value={newProduct.category}
                  onChange={handleAddChange}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="relative">
                <Hash size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="stock"
                  placeholder="Stock *"
                  value={newProduct.stock}
                  onChange={handleAddChange}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="relative md:col-span-2">
                <Image size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="image_url"
                  placeholder="URL de la imagen (opcional)"
                  value={newProduct.image_url}
                  onChange={handleAddChange}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <motion.button
              type="submit"
              className="w-full bg-green-400 text-white py-2 rounded-lg hover:bg-green-500 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Guardar Producto
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

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
                className="bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-200"
              >
                {editingProductId === product.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <Tag size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="name"
                          placeholder="Nombre del producto *"
                          value={editedProduct.name}
                          onChange={handleEditChange}
                          className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      <div className="relative">
                        <DollarSign size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          name="price"
                          placeholder="Precio *"
                          value={editedProduct.price}
                          onChange={handleEditChange}
                          className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Box size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="category"
                          placeholder="Categoría *"
                          value={editedProduct.category}
                          onChange={handleEditChange}
                          className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Hash size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          name="stock"
                          placeholder="Stock *"
                          value={editedProduct.stock}
                          onChange={handleEditChange}
                          className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      <div className="relative md:col-span-2">
                        <Image size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="image_url"
                          placeholder="URL de la imagen (opcional)"
                          value={editedProduct.image_url}
                          onChange={handleEditChange}
                          className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <motion.button
                        onClick={handleSaveEdit}
                        className="flex-1 bg-green-400 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-500 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Save size={18} /> Guardar
                      </motion.button>
                      <motion.button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-400 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <X size={18} /> Cancelar
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
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
                        onClick={() => handleEditClick(product)}
                        className="text-blue-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Edit size={20} />
                      </motion.button>
                      <motion.button
                        onClick={() => onDeleteProduct(product.id)}
                        className="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={20} />
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

export default AdminPanel;