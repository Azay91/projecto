import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, PlusCircle, Edit, Trash2, Save, X, Search, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const RoleManagement = React.memo(() => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({}); // { role_name: [permission_id, ...] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRole, setEditingRole] = useState(null); // The role name being edited
  const [newRoleName, setNewRoleName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRolesAndPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all unique roles from the users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('role');
      if (usersError) throw usersError;
      const uniqueRoles = [...new Set(usersData.map(u => u.role))].sort();
      setRoles(uniqueRoles);

      // Fetch all available permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('name', { ascending: true });
      if (permissionsError) throw permissionsError;
      setPermissions(permissionsData);

      // Fetch all role-permission mappings
      const { data: rolePermissionsData, error: rolePermissionsError } = await supabase
        .from('role_permissions')
        .select('*');
      if (rolePermissionsError) throw rolePermissionsError;

      const mappedRolePermissions = {};
      uniqueRoles.forEach(role => {
        mappedRolePermissions[role] = rolePermissionsData
          .filter(rp => rp.role_name === role)
          .map(rp => rp.permission_id);
      });
      setRolePermissions(mappedRolePermissions);

    } catch (err) {
      console.error('Error fetching roles and permissions:', err);
      setError('Error al cargar roles y permisos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, [fetchRolesAndPermissions]);

  const handleTogglePermission = useCallback((roleName, permissionId) => {
    setRolePermissions(prev => {
      const currentPermissions = prev[roleName] || [];
      if (currentPermissions.includes(permissionId)) {
        return {
          ...prev,
          [roleName]: currentPermissions.filter(id => id !== permissionId)
        };
      } else {
        return {
          ...prev,
          [roleName]: [...currentPermissions, permissionId]
        };
      }
    });
  }, []);

  const handleSaveRolePermissions = useCallback(async (roleName) => {
    setLoading(true);
    try {
      // Delete existing permissions for the role
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_name', roleName);
      if (deleteError) throw deleteError;

      // Insert new permissions for the role
      const permissionsToInsert = (rolePermissions[roleName] || []).map(permissionId => ({
        role_name: roleName,
        permission_id: permissionId
      }));

      if (permissionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(permissionsToInsert);
        if (insertError) throw insertError;
      }

      alert(`Permisos para el rol '${roleName}' guardados con éxito.`);
      setEditingRole(null);
    } catch (err) {
      console.error('Error saving role permissions:', err);
      alert('Error al guardar permisos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [rolePermissions]);

  const handleAddRole = useCallback(async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      alert('El nombre del nuevo rol no puede estar vacío.');
      return;
    }
    if (roles.includes(newRoleName.trim())) {
      alert('Este rol ya existe.');
      return;
    }

    setLoading(true);
    try {
      // Add the new role to the 'users' table (e.g., by creating a dummy user or updating an existing one)
      // For simplicity, we'll just add it to our local state and assume it will be used in user creation
      // In a real app, you might have a dedicated 'roles' table.
      setRoles(prev => [...prev, newRoleName.trim()].sort());
      setRolePermissions(prev => ({ ...prev, [newRoleName.trim()]: [] }));
      setNewRoleName('');
      alert(`Rol '${newRoleName.trim()}' añadido. Ahora puedes asignarle permisos.`);
    } catch (err) {
      console.error('Error adding role:', err);
      alert('Error al añadir el rol: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [newRoleName, roles]);

  const handleDeleteRole = useCallback(async (roleName) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el rol '${roleName}'? Esto no eliminará a los usuarios con este rol, pero perderán sus permisos.`)) {
      setLoading(true);
      try {
        // Remove all permissions associated with this role
        const { error: deletePermissionsError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_name', roleName);
        if (deletePermissionsError) throw deletePermissionsError;

        // Update users who have this role to a default role (e.g., 'cashier')
        const { error: updateUsersError } = await supabase
          .from('users')
          .update({ role: 'cashier' }) // Assign a default role
          .eq('role', roleName);
        if (updateUsersError) throw updateUsersError;

        setRoles(prev => prev.filter(r => r !== roleName));
        setRolePermissions(prev => {
          const newRp = { ...prev };
          delete newRp[roleName];
          return newRp;
        });
        alert(`Rol '${roleName}' y sus permisos eliminados. Los usuarios con este rol han sido asignados a 'cashier'.`);
      } catch (err) {
        console.error('Error deleting role:', err);
        alert('Error al eliminar el rol: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const filteredRoles = useMemo(() => {
    if (!searchTerm) {
      return roles;
    }
    return roles.filter(role =>
      role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

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
        <p className="ml-4 text-gray-600">Cargando roles y permisos...</p>
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
        <Shield size={28} className="text-indigo-400" />
        Gestión de Roles y Permisos
      </h2>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center bg-gray-100 rounded-xl p-3 shadow-inner flex-grow">
          <Search className="text-gray-500 mr-3" size={24} />
          <input
            type="text"
            placeholder="Buscar rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500 text-lg"
          />
        </div>
        <motion.button
          onClick={() => setEditingRole(null)} // Clear editing state when adding
          className="bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-500 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlusCircle size={18} />
          Añadir Rol
        </motion.button>
      </div>

      <AnimatePresence>
        {editingRole === null && ( // Show add role form if not editing any role
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleAddRole}
            className="bg-gray-100 p-4 rounded-lg mb-6 space-y-3 overflow-hidden"
          >
            <h4 className="font-semibold text-gray-700">Nuevo Rol</h4>
            <input
              type="text"
              name="newRoleName"
              placeholder="Nombre del nuevo rol"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
            <motion.button
              type="submit"
              className="w-full bg-green-400 text-white py-2 rounded-lg hover:bg-green-500 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Crear Rol
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        <div className="space-y-3">
          <AnimatePresence>
            {filteredRoles.map((roleName) => (
              <motion.div
                key={roleName}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-200"
              >
                {editingRole === roleName ? (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 text-lg">Editando Rol: {roleName}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map(permission => (
                        <div key={permission.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`perm-${roleName}-${permission.id}`}
                            checked={rolePermissions[roleName]?.includes(permission.id) || false}
                            onChange={() => handleTogglePermission(roleName, permission.id)}
                            className="form-checkbox h-5 w-5 text-blue-500 rounded"
                          />
                          <label htmlFor={`perm-${roleName}-${permission.id}`} className="text-gray-700">
                            {permission.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <motion.button
                        onClick={() => handleSaveRolePermissions(roleName)}
                        className="flex-1 bg-green-400 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-500 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Save size={18} /> Guardar
                      </motion.button>
                      <motion.button
                        onClick={() => setEditingRole(null)}
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
                      <h4 className="font-medium text-gray-800 text-lg">{roleName.charAt(0).toUpperCase() + roleName.slice(1)}</h4>
                      <p className="text-sm text-gray-500">
                        Permisos: {rolePermissions[roleName]?.length || 0} asignados
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => setEditingRole(roleName)}
                        className="text-blue-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Edit size={20} />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteRole(roleName)}
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

export default RoleManagement;