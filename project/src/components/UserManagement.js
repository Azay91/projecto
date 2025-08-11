import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, PlusCircle, Edit, Trash2, Save, X, Search, KeyRound, UserCheck, UserX } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const UserManagement = React.memo(() => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'cashier'
  });
  const [editedUser, setEditedUser] = useState({
    id: null,
    username: '',
    name: '',
    role: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const roles = ['admin', 'cashier']; // Define available roles

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('users').select('*').order('name', { ascending: true });
    if (error) {
      console.error('Error fetching users:', error);
      setError('Error al cargar usuarios: ' + error.message);
    } else {
      setUsers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    return '';
  };

  const validateUsername = (username, currentUserId = null) => {
    if (!username) {
      return 'El nombre de usuario no puede estar vacío.';
    }
    const isDuplicate = users.some(user => user.username === username && user.id !== currentUserId);
    if (isDuplicate) {
      return 'Este nombre de usuario ya existe.';
    }
    return '';
  };

  const handleAddUserChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      setPasswordError(validatePassword(value));
    }
    if (name === 'username') {
      setUsernameError(validateUsername(value));
    }
  }, [users]);

  const handleAddUserSubmit = useCallback(async (e) => {
    e.preventDefault();
    const passError = validatePassword(newUser.password);
    const userError = validateUsername(newUser.username);

    if (passError || userError) {
      setPasswordError(passError);
      setUsernameError(userError);
      return;
    }

    if (!newUser.username || !newUser.password || !newUser.name || !newUser.role) {
      alert('Por favor, rellena todos los campos para el nuevo usuario.');
      return;
    }

    const { data, error } = await supabase.from('users').insert(newUser).select().single();
    if (error) {
      console.error('Error adding user:', error);
      alert('Error al añadir el usuario: ' + error.message);
    } else {
      setUsers(prev => [...prev, data]);
      setNewUser({ username: '', password: '', name: '', role: 'cashier' });
      setIsAdding(false);
      setPasswordError('');
      setUsernameError('');
      alert('Usuario añadido con éxito.');
    }
  }, [newUser, users]);

  const handleEditClick = useCallback((user) => {
    setEditingUserId(user.id);
    setEditedUser({ id: user.id, username: user.username, name: user.name, role: user.role });
    setUsernameError(''); // Clear username error when starting edit
  }, []);

  const handleEditChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));

    if (name === 'username') {
      setUsernameError(validateUsername(value, editedUser.id));
    }
  }, [users, editedUser.id]);

  const handleSaveEdit = useCallback(async () => {
    const userError = validateUsername(editedUser.username, editedUser.id);
    if (userError) {
      setUsernameError(userError);
      return;
    }

    if (!editedUser.username || !editedUser.name || !editedUser.role) {
      alert('Por favor, rellena todos los campos para el usuario editado.');
      return;
    }
    const { data, error } = await supabase.from('users').update({
      username: editedUser.username,
      name: editedUser.name,
      role: editedUser.role
    }).eq('id', editedUser.id).select().single();
    if (error) {
      console.error('Error updating user:', error);
      alert('Error al actualizar el usuario: ' + error.message);
    } else {
      setUsers(prev => prev.map(u => u.id === data.id ? data : u));
      setEditingUserId(null);
      setUsernameError('');
      alert('Usuario actualizado con éxito.');
    }
  }, [editedUser, users]);

  const handleCancelEdit = useCallback(() => {
    setEditingUserId(null);
    setUsernameError(''); // Clear username error when canceling edit
  }, []);

  const handleDeleteUser = useCallback(async (userId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) {
        console.error('Error deleting user:', error);
        alert('Error al eliminar el usuario: ' + error.message);
      } else {
        setUsers(prev => prev.filter(u => u.id !== userId));
        alert('Usuario eliminado con éxito.');
      }
    }
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return users;
    }
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

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
        <p className="ml-4 text-gray-600">Cargando usuarios...</p>
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
        <Users size={28} className="text-purple-400" />
        Gestión de Usuarios
      </h2>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center bg-gray-100 rounded-xl p-3 shadow-inner flex-grow">
          <Search className="text-gray-500 mr-3" size={24} />
          <input
            type="text"
            placeholder="Buscar usuario por nombre, usuario o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500 text-lg"
          />
        </div>
        <motion.button
          onClick={() => { setIsAdding(!isAdding); setEditingUserId(null); setPasswordError(''); setUsernameError(''); }}
          className="bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-500 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlusCircle size={18} />
          {isAdding ? 'Cancelar' : 'Añadir Usuario'}
        </motion.button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleAddUserSubmit}
            className="bg-gray-100 p-4 rounded-lg mb-6 space-y-3 overflow-hidden"
          >
            <h4 className="font-semibold text-gray-700">Nuevo Usuario</h4>
            <input
              type="text"
              name="name"
              placeholder="Nombre completo *"
              value={newUser.name}
              onChange={handleAddUserChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
            <input
              type="text"
              name="username"
              placeholder="Nombre de usuario *"
              value={newUser.username}
              onChange={handleAddUserChange}
              className={`w-full p-2 border rounded-md ${usernameError ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {usernameError && <p className="text-red-500 text-sm">{usernameError}</p>}
            <div className="relative">
              <input
                type="password"
                name="password"
                placeholder="Contraseña *"
                value={newUser.password}
                onChange={handleAddUserChange}
                className={`w-full p-2 border rounded-md pr-10 ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              <KeyRound size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Rol:</label>
              <select
                name="role"
                value={newUser.role}
                onChange={handleAddUserChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                ))}
              </select>
            </div>
            <motion.button
              type="submit"
              className="w-full bg-green-400 text-white py-2 rounded-lg hover:bg-green-500 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Guardar Usuario
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        <div className="space-y-3">
          <AnimatePresence>
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-200"
              >
                {editingUserId === user.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="name"
                      placeholder="Nombre completo *"
                      value={editedUser.name}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                    <input
                      type="text"
                      name="username"
                      placeholder="Nombre de usuario *"
                      value={editedUser.username}
                      onChange={handleEditChange}
                      className={`w-full p-2 border rounded-md ${usernameError ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                    {usernameError && <p className="text-red-500 text-sm">{usernameError}</p>}
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Rol:</label>
                      <select
                        name="role"
                        value={editedUser.role}
                        onChange={handleEditChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                        ))}
                      </select>
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
                      {user.role === 'admin' ? (
                        <UserCheck size={24} className="text-blue-500" />
                      ) : (
                        <UserX size={24} className="text-gray-500" />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-800">{user.name}</h4>
                        <p className="text-sm text-gray-500">Usuario: {user.username}</p>
                        <p className="text-xs text-gray-400">Rol: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => handleEditClick(user)}
                        className="text-blue-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Edit size={20} />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteUser(user.id)}
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

export default UserManagement;