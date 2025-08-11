import React from 'react';
import { motion } from 'framer-motion';
import { MinusCircle, PlusCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const CartItem = React.memo(({ item, onUpdateQuantity, onRemoveItem }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200"
    >
      <div className="flex items-center gap-3">
        <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
        <div>
          <h4 className="font-medium text-gray-800">{item.name}</h4>
          <p className="text-sm text-gray-500">{formatCurrency(item.price)} x {item.quantity}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <motion.button
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="text-red-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MinusCircle size={20} />
        </motion.button>
        <span className="font-semibold text-gray-700">{item.quantity}</span>
        <motion.button
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="text-green-500 hover:text-green-600"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <PlusCircle size={20} />
        </motion.button>
        <motion.button
          onClick={() => onRemoveItem(item.id)}
          className="text-gray-400 hover:text-red-500 ml-2"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <XCircle size={20} />
        </motion.button>
      </div>
    </motion.div>
  );
});

export default CartItem;