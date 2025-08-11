import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, PlusCircle, Edit, Trash2, Save, X, Search, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const CustomerManagement = React.memo(() => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [editedCustomer, setEditedCustomer] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true });
    if (error) {
      console.error('Error fetching customers:', error);
      setError('Error al cargar clientes: ' + error.message);
    } else {
      setCustomers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomerChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAddCustomerSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!newCustomer.name) {
      alert('El nombre del cliente es obligatorio.');
      return;
    }
    const { data, error } = await supabase.from('customers').insert(newCustomer).select().single();
    if (error) {
      console.error('Error adding customer:', error);
      alert('Error al añadir el cliente: ' + error.message);
    } else {
      setCustomers(prev => [...prev, data]);
      setNewCustomer({ name: '', email: '', phone: '', address: '' });
      setIsAdding(false);
      alert('Cliente añadido con éxito.');
    }
  }, [newCustomer]);

  const handleEditClick = useCallback((customer) => {
    setEditingCustomerId(customer.id);
    setEditedCustomer({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    });
  }, []);

  const handleEditChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditedCustomer(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editedCustomer.name) {
      alert('El nombre del cliente es obligatorio.');
      return;
    }
    const { data, error } = await supabase.from('customers').update({
      name: editedCustomer.name,
      email: editedCustomer.email,
      phone: editedCustomer.phone,
      address: editedCustomer.address
    }).eq('id', editedCustomer.id).select().single();
    if (error) {
      console.error('Error updating customer:', error);
      alert('Error al actualizar el cliente: ' + error.message);
    } else {
      setCustomers(prev => prev.map(c => c.id === data.id ? data : c));
      setEditingCustomerId(null);
      alert('Cliente actualizado con éxito.');
    }
  }, [editedCustomer]);

  const handleCancelEdit = useCallback(() => {
    setEditingCustomerId(null);
  }, []);

  const handleDeleteCustomer = useCallback(async (customerId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      const { error } = await supabase.from('customers').delete().eq('id', customerId);
      if (error) {
        console.error('Error deleting customer:', error);
        alert('Error al eliminar el cliente: ' + error.message);
      } else {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        alert('Cliente eliminado con éxito.');
      }
    }
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) {
      return customers;
    }
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchTerm))
    );
  }, [customers, searchTerm]);

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
        <p className="ml-4 text-gray-600">Cargando clientes...</p>
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
        <Users size={28} className="text-teal-400" />
        Gestión de Clientes
      </h2>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center bg-gray-100 rounded-xl p-3 shadow-inner flex-grow">
          <Search className="text-gray-500 mr-3" size={24} />
          <input
            type="text"
            placeholder="Buscar cliente por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500 text-lg"
          />
        </div>
        <motion.button
          onClick={() => { setIsAdding(!isAdding); setEditingCustomerId(null); }}
          className="bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-500 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlusCircle size={18} />
          {isAdding ? 'Cancelar' : 'Añadir Cliente'}
        </motion.button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleAddCustomerSubmit}
            className="bg-gray-100 p-4 rounded-lg mb-6 space-y-3 overflow-hidden"
          >
            <h4 className="font-semibold text-gray-700">Nuevo Cliente</h4>
            <input
              type="text"
              name="name"
              placeholder="Nombre completo *"
              value={newCustomer.name}
              onChange={handleAddCustomerChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={newCustomer.email}
                onChange={handleAddCustomerChange}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="relative">
              <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="phone"
                placeholder="Teléfono"
                value={newCustomer.phone}
                onChange={handleAddCustomerChange}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="relative">
              <MapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <textarea
                name="address"
                placeholder="Dirección"
                value={newCustomer.address}
                onChange={handleAddCustomerChange}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                rows="2"
              />
            </div>
            <motion.button
              type="submit"
              className="w-full bg-green-400 text-white py-2 rounded-lg hover:bg-green-500 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Guardar Cliente
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        <div className="space-y-3">
          <AnimatePresence>
            {filteredCustomers.map((customer) => (
              <motion.div
                key={customer.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-200"
              >
                {editingCustomerId === customer.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="name"
                      placeholder="Nombre completo *"
                      value={editedCustomer.name}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                    <div className="relative">
                      <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={editedCustomer.email}
                        onChange={handleEditChange}
                        className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="relative">
                      <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Teléfono"
                        value={editedCustomer.phone}
                        onChange={handleEditChange}
                        className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="relative">
                      <MapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <textarea
                        name="address"
                        placeholder="Dirección"
                        value={editedCustomer.address}
                        onChange={handleEditChange}
                        className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                        rows="2"
                      />
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
                    <div>
                      <h4 className="font-medium text-gray-800">{customer.name}</h4>
                      {customer.email && <p className="text-sm text-gray-500 flex items-center gap-1"><Mail size={14} /> {customer.email}</p>}
                      {customer.phone && <p className="text-sm text-gray-500 flex items-center gap-1"><Phone size={14} /> {customer.phone}</p>}
                      {customer.address && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12} /> {customer.address}</p>}
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => handleEditClick(customer)}
                        className="text-blue-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Edit size={20} />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteCustomer(customer.id)}
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

export default CustomerManagement;