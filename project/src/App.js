import React, { useState, Suspense, lazy, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import MainLayout from './components/MainLayout';
import CartSummary from './components/CartSummary';
import LoginScreen from './components/LoginScreen';
import { defaultUsers } from './mock/users';
import { calculateTotal } from './utils/helpers';
import { supabase } from './utils/supabaseClient';

// Lazy load components
const ProductGrid = lazy(() => import('./components/ProductGrid'));
const SalesHistory = lazy(() => import('./components/SalesHistory'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const DailySummary = lazy(() => import('./components/DailySummary'));
const CustomerManagement = lazy(() => import('./components/CustomerManagement'));
const ReturnManagement = lazy(() => import('./components/ReturnManagement'));
const InventoryManagement = lazy(() => import('./components/InventoryManagement'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const RoleManagement = lazy(() => import('./components/RoleManagement'));

const App = () => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState('pos');
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);

  // Fetch products from Supabase on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      setErrorProducts(null);
      const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
      if (error) {
        console.error('Error fetching products:', error);
        setErrorProducts('Error al cargar productos: ' + error.message);
      } else {
        setProducts(data);
      }
      setLoadingProducts(false);
    };
    fetchProducts();
  }, []);

  const handleLogin = (username, password) => {
    const user = defaultUsers.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'cashier') {
        setActiveTab('pos');
      } else {
        setActiveTab('pos');
      }
    } else {
      alert('Usuario o contraseña incorrectos. ¡Inténtalo de nuevo, cerebrito!');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCartItems([]);
    setActiveTab('pos');
  };

  const handleAddToCart = useCallback((productToAdd) => {
    const productInStock = products.find(p => p.id === productToAdd.id);
    if (!productInStock || productInStock.stock <= 0) {
      alert(`¡Lo siento! ${productToAdd.name} está agotado.`);
      return;
    }

    const existingItem = cartItems.find(item => item.id === productToAdd.id);

    if (existingItem) {
      if (existingItem.quantity + 1 > productInStock.stock) {
        alert(`No hay suficiente stock de ${productInStock.name}. Solo quedan ${productInStock.stock}.`);
        return;
      }
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productToAdd.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems(prevItems => [...prevItems, { ...productToAdd, quantity: 1 }]);
    }
  }, [products, cartItems]);

  const handleUpdateQuantity = useCallback((itemId, newQuantity) => {
    const productInStock = products.find(p => p.id === itemId);
    if (!productInStock) return;

    if (newQuantity > productInStock.stock) {
      alert(`No hay suficiente stock de ${productInStock.name}. Solo quedan ${productInStock.stock}.`);
      return;
    }

    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  }, [products]);

  const handleRemoveItem = useCallback((itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);

  const handleCheckout = useCallback(async () => { // Simplified checkout
    if (cartItems.length === 0) {
      alert('El carrito está vacío. ¡No puedes cobrar aire!');
      return;
    }

    // Verificar stock final antes de procesar
    for (const cartItem of cartItems) {
      const productInStock = products.find(p => p.id === cartItem.id);
      if (!productInStock || productInStock.stock < cartItem.quantity) {
        alert(`Error de stock: No hay suficiente ${cartItem.name}. Solo quedan ${productInStock ? productInStock.stock : 0}.`);
        return;
      }
    }

    const total = calculateTotal(cartItems);

    setShowConfirmation(true);

    try {
      // 1. Insert sale into 'sales' table
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          total_amount: total,
          tax_amount: 0,
          subtotal_amount: total,
          sold_by: currentUser ? currentUser.name : 'Desconocido',
          // customer_id: null // No customer_id anymore
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Insert sale items into 'sale_items' table
      const saleItemsToInsert = cartItems.map(item => ({
        sale_id: saleData.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price_at_sale: item.price,
        total_item_price: item.price * item.quantity
      }));

      const { error: saleItemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsToInsert);

      if (saleItemsError) throw saleItemsError;

      // 3. Update product stock and log inventory changes
      for (const item of cartItems) {
        const currentProduct = products.find(p => p.id === item.id);
        const newStock = currentProduct.stock - item.quantity;

        const { data: productUpdate, error: productUpdateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.id);

        if (productUpdateError) throw productUpdateError;

        // Log inventory change
        const { error: logError } = await supabase
          .from('inventory_logs')
          .insert({
            product_id: item.id,
            product_name: item.name,
            change_type: 'salida',
            quantity_change: item.quantity,
            new_stock: newStock,
            reason: `Venta - ID de Venta: ${saleData.id}`
          });

        if (logError) console.error('Error logging inventory:', logError);
      }

      // No loyalty points handling anymore

      // Refresh products after sale
      const { data: updatedProducts, error: fetchError } = await supabase.from('products').select('*').order('name', { ascending: true });
      if (fetchError) console.error('Error fetching updated products:', fetchError);
      else setProducts(updatedProducts);

      setCartItems([]);
      setShowConfirmation(false);
      alert('¡Venta procesada con éxito! Gracias por tu dinero.');

    } catch (error) {
      console.error('Error during checkout:', error);
      setShowConfirmation(false);
      alert(`Error al procesar la venta: ${error.message}`);
    }
  }, [cartItems, products, currentUser]);

  const handleClearCart = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito? ¡Todo ese dinero se irá!')) {
      setCartItems([]);
    }
  }, []);

  const handleAddProduct = useCallback(async (productData) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        price: productData.price,
        category: productData.category,
        stock: productData.stock,
        image_url: productData.image_url
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      alert('Error al añadir el producto: ' + error.message);
    } else {
      setProducts(prevProducts => [...prevProducts, data]);
      // Log initial stock
      const { error: logError } = await supabase
        .from('inventory_logs')
        .insert({
          product_id: data.id,
          product_name: data.name,
          change_type: 'entrada',
          quantity_change: data.stock,
          new_stock: data.stock,
          reason: 'Producto añadido inicialmente'
        });
      if (logError) console.error('Error logging initial product stock:', logError);
      alert('Producto añadido con éxito.');
    }
  }, []);

  const handleUpdateProduct = useCallback(async (productId, updatedData) => {
    const oldProduct = products.find(p => p.id === productId);
    const { data, error } = await supabase
      .from('products')
      .update(updatedData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      alert('Error al actualizar el producto: ' + error.message);
    } else {
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId ? data : product
        )
      );
      // Log stock change if stock was updated
      if (oldProduct && oldProduct.stock !== data.stock) {
        const quantityChange = data.stock - oldProduct.stock;
        const changeType = quantityChange > 0 ? 'entrada' : 'salida';
        const { error: logError } = await supabase
          .from('inventory_logs')
          .insert({
            product_id: data.id,
            product_name: data.name,
            change_type: changeType,
            quantity_change: Math.abs(quantityChange),
            new_stock: data.stock,
            reason: 'Ajuste de stock manual'
          });
        if (logError) console.error('Error logging stock update:', logError);
      }
      alert('Producto actualizado con éxito.');
    }
  }, [products]);

  const handleDeleteProduct = useCallback(async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto? ¡No podrás venderlo más!')) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        alert('Error al eliminar el producto: ' + error.message);
      } else {
        setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
        alert('Producto eliminado con éxito.');
      }
    }
  }, []);

  const handleAdjustStock = useCallback(async (productId, productName, type, quantity, reason) => {
    const currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) {
      alert('Producto no encontrado.');
      return;
    }

    let newStock = currentProduct.stock;
    if (type === 'entrada') {
      newStock += quantity;
    } else if (type === 'salida') {
      newStock -= quantity;
    } else if (type === 'ajuste') {
      newStock = quantity; // For 'ajuste', quantity is the new stock level
    }

    if (newStock < 0) {
      alert('El stock no puede ser negativo.');
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error adjusting stock:', error);
      alert('Error al ajustar el stock: ' + error.message);
    } else {
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId ? data : product
        )
      );
      const { error: logError } = await supabase
        .from('inventory_logs')
        .insert({
          product_id: productId,
          product_name: productName,
          change_type: type,
          quantity_change: quantity,
          new_stock: newStock,
          reason: reason || `Ajuste de stock: ${type}`
        });
      if (logError) console.error('Error logging stock adjustment:', logError);
      alert('Stock ajustado con éxito.');
    }
  }, [products]);

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (loadingProducts) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="w-20 h-20 border-4 border-blue-400 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="ml-4 text-xl text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  if (errorProducts) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500 text-xl">
        <p>{errorProducts}</p>
      </div>
    );
  }

  return (
    <MainLayout activeTab={activeTab} onTabChange={setActiveTab} currentUser={currentUser} onLogout={handleLogout}>
      <main className="flex-1 container mx-auto px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Suspense fallback={
          <div className="col-span-3 flex items-center justify-center h-64">
            <motion.div
              className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        }>
          {activeTab === 'pos' && (
            <>
              <motion.div
                className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Productos Disponibles</h2>
                <ProductGrid products={products} onAddToCart={handleAddToCart} />
              </motion.div>
              <div className="lg:col-span-1">
                <CartSummary
                  cartItems={cartItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onCheckout={handleCheckout}
                  onClearCart={handleClearCart}
                />
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <SalesHistory />
            </motion.div>
          )}

          {activeTab === 'returns' && currentUser.role === 'admin' && (
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ReturnManagement />
            </motion.div>
          )}

          {activeTab === 'admin' && currentUser.role === 'admin' && (
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <AdminPanel
                products={products}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onAdjustStock={handleAdjustStock}
              />
            </motion.div>
          )}

          {activeTab === 'summary' && currentUser.role === 'admin' && (
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <DailySummary />
            </motion.div>
          )}

          {activeTab === 'customers' && currentUser.role === 'admin' && (
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <CustomerManagement />
            </motion.div>
          )}

          {activeTab === 'inventory' && currentUser.role === 'admin' && (
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <InventoryManagement />
            </motion.div>
          )}

          {activeTab === 'users' && currentUser.role === 'admin' && (
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <UserManagement />
            </motion.div>
          )}

          {activeTab === 'roles' && currentUser.role === 'admin' && (
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <RoleManagement />
            </motion.div>
          )}
        </Suspense>
      </main>

      {showConfirmation && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white p-8 rounded-xl shadow-2xl text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
          >
            <div className="flex items-center justify-center mb-4">
              <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Pago Exitoso!</h3>
            <p className="text-gray-600">Tu transacción ha sido procesada. ¡Gracias por tu compra!</p>
          </motion.div>
        </motion.div>
      )}
    </MainLayout>
  );
};

export default App;