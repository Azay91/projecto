import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, User } from 'lucide-react';

const Header = ({ currentUser, onLogout }) => {
  return (
    <motion.header
      className="bg-gradient-to-r from-blue-400 to-purple-500 text-white p-4 shadow-lg"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14 }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-3xl font-bold">Punto de Venta</h1>
        <div className="flex items-center space-x-4">
          {currentUser && (
            <motion.div
              className="flex items-center bg-white/30 px-3 py-2 rounded-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <User className="w-5 h-5 mr-2" />
              <span className="font-medium">{currentUser.name} ({currentUser.role})</span>
            </motion.div>
          )}
          <motion.button
            onClick={onLogout}
            className="bg-white text-blue-500 px-4 py-2 rounded-full shadow-md hover:bg-blue-100 transition-colors flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar Sesión
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;