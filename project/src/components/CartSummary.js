import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, calculateTotal } from '../utils/helpers';
import { Trash2, MinusCircle, PlusCircle, ShoppingBag, XCircle } from 'lucide-react';

const CartSummary = ({ cartItems, onUpdateQuantity, onRemoveItem, onCheckout, onClearCart }) => {
  const total = calculateTotal(cartItems);

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-6 sticky top-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <ShoppingBag size={28} className="text-blue-400" />
        Carrito de Compras
      </h2>

      {cartItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-10 text-gray-500"
        >
          <XCircle size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-medium">El carrito está vacío. ¡Añade algunos productos!</p>
        </motion.div>
      ) : (
        <>
          <div className="max-h-80 overflow-y-auto pr-2 -mr-2 mb-6">
            <AnimatePresence>
              {cartItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-3 shadow-sm border border-gray-200"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-600">{formatCurrency(item.price)} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="text-blue-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-100 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <MinusCircle size={20} />
                    </motion.button>
                    <span className="font-bold text-gray-800">{item.quantity}</span>
                    <motion.button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="text-blue-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-100 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <PlusCircle size={20} />
                    </motion.button>
                    <motion.button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition-colors ml-2"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={20} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold text-gray-700">Total:</span>
              <span className="text-3xl font-extrabold text-blue-500">{formatCurrency(total)}</span>
            </div>
            <motion.button
              onClick={onCheckout}
              className="w-full bg-green-400 text-white py-3 rounded-lg font-semibold text-lg shadow-md hover:bg-green-500 transition-colors mb-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Procesar Venta
            </motion.button>
            <motion.button
              onClick={onClearCart}
              className="w-full bg-red-400 text-white py-3 rounded-lg font-semibold text-lg shadow-md hover:bg-red-500 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Vaciar Carrito
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default CartSummary;