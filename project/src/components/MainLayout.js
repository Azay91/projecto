import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import { ChevronDown, ChevronUp } from 'lucide-react';

const MainLayout = ({ children, activeTab, onTabChange, currentUser, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const mainTabs = [
    { id: 'pos', name: 'Punto de Venta', roles: ['admin', 'cashier'] },
    { id: 'history', name: 'Historial de Ventas', roles: ['admin', 'cashier'] },
    { id: 'returns', name: 'Devoluciones', roles: ['admin'] },
  ];

  const dropdownTabs = [
    { id: 'admin', name: 'Administración', roles: ['admin'] },
    { id: 'summary', name: 'Resumen Diario', roles: ['admin'] },
    { id: 'customers', name: 'Clientes', roles: ['admin'] },
    { id: 'inventory', name: 'Inventario', roles: ['admin'] },
    { id: 'users', name: 'Usuarios', roles: ['admin'] },
    { id: 'roles', name: 'Roles y Permisos', roles: ['admin'] },
  ];

  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    setIsDropdownOpen(false); // Close dropdown after selecting a tab
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header currentUser={currentUser} onLogout={onLogout} />
      <div className="container mx-auto px-6 py-4 flex-grow flex flex-col">
        {/* Main Tabs (Top Bar) */}
        <div className="w-full flex justify-center mb-6">
          <div className="bg-white p-2 rounded-xl shadow-md flex flex-wrap justify-center gap-2 w-full relative">
            {mainTabs.map((tab) => (
              (tab.roles.includes(currentUser.role)) && (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-blue-400 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tab.name}
                </motion.button>
              )
            ))}

            {/* "Más Opciones" Dropdown */}
            {currentUser.role === 'admin' && (
              <div className="relative">
                <motion.button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center gap-2 ${
                    isDropdownOpen || dropdownTabs.some(tab => tab.id === activeTab)
                      ? 'bg-blue-400 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Más Opciones
                  {isDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </motion.button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg py-2 z-10 min-w-[200px]"
                    >
                      {dropdownTabs.map((tab) => (
                        (tab.roles.includes(currentUser.role)) && (
                          <motion.button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`w-full text-left px-4 py-2 font-semibold transition-colors duration-200 ${
                              activeTab === tab.id
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            whileHover={{ x: 5 }}
                          >
                            {tab.name}
                          </motion.button>
                        )
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;