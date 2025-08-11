import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/helpers';
import { ShoppingCart } from 'lucide-react';

const ProductGrid = ({ products, onAddToCart }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <motion.div
          key={product.id}
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.03 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <img
            src={product.image_url || 'https://via.placeholder.com/150'}
            alt={product.name}
            className="w-full h-32 object-cover"
          />
          <div className="p-4">
            <h3 className="font-bold text-lg text-gray-800 truncate">{product.name}</h3>
            <p className="text-gray-600 text-sm mb-2">{product.category}</p>
            <div className="flex justify-between items-center mb-4">
              <span className="text-blue-500 font-extrabold text-xl">{formatCurrency(product.price)}</span>
              <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                Stock: {product.stock}
              </span>
            </div>
            <motion.button
              onClick={() => onAddToCart(product)}
              className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                product.stock > 0
                  ? 'bg-blue-400 text-white hover:bg-blue-500'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              disabled={product.stock <= 0}
              whileHover={{ scale: product.stock > 0 ? 1.02 : 1 }}
              whileTap={{ scale: product.stock > 0 ? 0.98 : 1 }}
            >
              <ShoppingCart size={20} />
              {product.stock > 0 ? 'Añadir al Carrito' : 'Agotado'}
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ProductGrid;