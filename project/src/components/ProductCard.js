import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const ProductCard = React.memo(({ product, onAddToCart }) => {
  const isOutOfStock = product.stock <= 0;

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-md overflow-hidden cursor-pointer border border-gray-200 hover:shadow-lg transition-all duration-300 relative ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}
      whileHover={{ scale: isOutOfStock ? 1 : 1.03 }}
      whileTap={{ scale: isOutOfStock ? 1 : 0.98 }}
      onClick={() => !isOutOfStock && onAddToCart(product)}
    >
      <img
        src={product.image_url}
        alt={product.name}
        className="w-full h-32 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
        <p className="text-gray-600 text-sm">{product.category}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xl font-bold text-blue-600">{formatCurrency(product.price)}</span>
          <motion.button
            className={`p-2 rounded-full shadow-lg transition-colors duration-200 ${isOutOfStock ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            whileHover={{ scale: isOutOfStock ? 1 : 1.1 }}
            whileTap={{ scale: isOutOfStock ? 1 : 0.9 }}
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click from firing
              !isOutOfStock && onAddToCart(product);
            }}
            disabled={isOutOfStock}
          >
            <PlusCircle size={20} />
          </motion.button>
        </div>
      </div>
      {isOutOfStock && (
        <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center rounded-xl">
          <span className="text-white text-xl font-bold">Agotado</span>
        </div>
      )}
    </motion.div>
  );
});

export default ProductCard;