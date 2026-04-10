import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, clearCart } from './store/cartSlice';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; 
import ProductGrid from './ProductGrid';
import InventoryChart from './InventoryChart';

function App() {
  // --- AUTHENTICATION & ROLE STATE ---
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'Manager');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- APP STATE ---
  const [products, setProducts] = useState([]);
  const [view, setView] = useState('pos');
  const [managerTab, setManagerTab] = useState('inventory');
  // ✨ Updated state to include imageUrl
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '', imageUrl: '' }); 
  const [searchQuery, setSearchQuery] = useState('');

  // --- RECEIPT MODAL STATE ---
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [amountTendered, setAmountTendered] = useState('');
  const [showTenderModal, setShowTenderModal] = useState(false);

  // --- STAFF MANAGEMENT STATE ---
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState('Cashier');

  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  // --- PROFESSIONAL CURRENCY FORMATTER ---
  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  // --- FETCH PRODUCTS ---
  const fetchProducts = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  // --- LOGIN LOGIC WITH BULLETPROOF ROLE DETECTION ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const receivedToken = res.data.token;
      
      let finalRole = res.data.role || (res.data.user && res.data.user.role);
      
      if (!finalRole) {
        try {
          const payload = JSON.parse(atob(receivedToken.split('.')[1]));
          finalRole = payload.role;
        } catch (e) {
          console.error("Token decode error", e);
        }
      }
      
      if (!finalRole) {
          finalRole = 'Cashier'; 
      }

      finalRole = finalRole.charAt(0).toUpperCase() + finalRole.slice(1).toLowerCase();

      setToken(receivedToken);
      setUserRole(finalRole);
      
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('userRole', finalRole);

      if (finalRole !== 'Manager') {
        setView('pos');
      }

    } catch (err) {
      alert("Login failed! Check your credentials or terminal.");
      console.error(err);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUserRole('');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  };

  // --- ADD PRODUCT LOGIC ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/products', {
        name: newProduct.name,
        category: newProduct.category,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        barcode: "SKU-" + Date.now(),
        imageUrl: newProduct.imageUrl // ✨ Sending the image URL to backend
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setNewProduct({ name: '', category: '', price: '', stock: '', imageUrl: '' });
      fetchProducts();
      alert("Success! The product was saved to MongoDB.");
    } catch (err) {
      console.error("Failed to add product", err);
      const deepError = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      alert("Database Error: " + deepError);
    }
  };

  // --- RESTOCK LOGIC ---
  const handleRestock = async (productId, currentStock) => {
    const addedAmount = window.prompt("📦 How many new units arrived?", "10");
    
    if (!addedAmount || isNaN(addedAmount) || Number(addedAmount) <= 0) return;

    const baseStock = Number(currentStock) < 0 ? 0 : Number(currentStock);
    const newStock = baseStock + Number(addedAmount);

    try {
      await axios.put(`http://localhost:5000/api/products/${productId}`, {
        stock: newStock
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchProducts(); 
      alert("✅ Stock updated successfully!");
    } catch (err) {
      console.error("Failed to restock", err);
      alert("Error: Make sure your backend has a PUT route setup for updating products.");
    }
  };

  // --- DELETE PRODUCT LOGIC ---
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("🚨 Are you sure you want to delete this product? This cannot be undone.")) return;

    try {
      await axios.delete(`http://localhost:5000/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts(); 
      alert("🗑️ Product deleted successfully!");
    } catch (err) {
      console.error("Failed to delete product", err);
      alert("Error: Make sure your backend has a DELETE route setup.");
    }
  };

  // --- REGISTER STAFF LOGIC ---
  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        role: staffRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(`Success! ${staffName} has been registered as a ${staffRole}.`);
      
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffRole('Cashier');
    } catch (err) {
      console.error("Failed to register staff", err);
      alert("Registration Error: " + (err.response?.data?.message || err.message));
    }
  };

  // --- OPEN TENDER MODAL ---
  const handleOpenTender = () => {
    if (!cart?.items || cart.items.length === 0) {
      alert("The cart is empty!");
      return;
    }
    setShowTenderModal(true);
  };

  // --- CHECKOUT LOGIC ---
  const handleCheckout = async () => {
    if (!cart?.items || cart.items.length === 0) {
      alert("The cart is empty!");
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/products/checkout', {
        orderItems: cart.items,
        totalPrice: cart.totalAmount
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });

      setLastOrder({
        id: "INV-" + Math.floor(Math.random() * 1000000),
        date: new Date().toLocaleString(),
        items: [...cart.items],
        total: cart.totalAmount
      });

      dispatch(clearCart()); 
      fetchProducts(); 
      setShowReceipt(true); 
      
    } catch (err) {
      console.error("Checkout failed", err);
      alert("Checkout Error: " + (err.response?.data?.message || err.message));
    }
  };

  // --- REFUND LOGIC ---
  const handleRefund = async () => {
    if (!lastOrder) return;
    
    try {
      await axios.post('http://localhost:5000/api/products/refund', {
        orderItems: lastOrder.items
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });

      alert("Refund Successful! Items have been restocked.");
      setLastOrder(null); 
      fetchProducts(); 
      
    } catch (err) {
      console.error("Refund failed", err);
      alert("Refund Error: " + (err.response?.data?.message || err.message));
    }
  };

  // --- BULLETPROOF SEARCH FILTER ---
  const filteredProducts = products.filter(product => {
    const pName = product?.name || '';
    const pCat = product?.category || '';
    const query = searchQuery || '';
    return pName.toLowerCase().includes(query.toLowerCase()) || pCat.toLowerCase().includes(query.toLowerCase());
  });

  // ==========================================
  // VIEW 1: THE LOGIN SCREEN 
  // ==========================================
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 font-sans">
        {/* ✨ Animated Login Box */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100"
        >
          <div className="text-center mb-8">
            <div className="bg-gradient-to-tr from-blue-600 to-blue-400 text-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg shadow-blue-200">🔒</div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Infotact Security</h2>
            <p className="text-gray-500 text-sm mt-2 font-medium">Enterprise Access Portal</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <input type="email" required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="employee@infotact.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input type="password" required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-4 px-4 rounded-xl transition-all shadow-md hover:shadow-lg">Secure Login</button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: THE MAIN SYSTEM
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 font-sans relative selection:bg-purple-200">
      
      {/* ✨ Glassmorphism Sticky Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-10 bg-white/60 backdrop-blur-2xl sticky top-4 z-40 p-5 rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.05)] border border-white/80">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent tracking-tight">INFOTACT POS</h1>
          <div className="mt-2 flex gap-2">
            <button onClick={() => setView('pos')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${view === 'pos' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cashier Terminal</button>
            {userRole === 'Manager' && (
              <button onClick={() => setView('manager')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${view === 'manager' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Manager Dashboard</button>
            )}
          </div>
        </div>
        
        <div className="flex items-start gap-6">
          {view === 'pos' && (
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <span className="text-2xl">🛒</span>
                <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm">{cart?.items?.length || 0}</span>
              </div>
              <p className="text-xl font-black text-gray-800 mb-2 tracking-tight">
                Total: <span className="text-green-600">{formatINR(cart?.totalAmount)}</span>
              </p>
              <button onClick={handleOpenTender} className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-extrabold py-2 px-6 rounded-lg shadow-[0_10px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_10px_25px_rgba(34,197,94,0.4)] transition-all">
                Complete Checkout
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-4 bg-gray-50 p-2 pl-4 rounded-xl border border-gray-100">
            <div className="text-right">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Logged In</p>
              <p className="text-sm font-black text-gray-700">{userRole}</p>
            </div>
            <button onClick={handleLogout} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-bold text-sm transition-all border border-red-100 hover:border-red-600">Logout</button>
          </div>
        </div>
      </header>

      {/* POS VIEW */}
      {view === 'pos' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto">
          <div className="mb-8">
            <input 
              type="text" 
              placeholder="🔍 Search products by name or category..." 
              className="w-full p-5 rounded-2xl bg-white border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

         <main>
            {filteredProducts.length > 0 ? (
              <ProductGrid 
                products={filteredProducts} 
                formatINR={formatINR}
                onAddToCart={(product) => dispatch(addToCart({ productId: product._id, name: product.name, price: product.price }))}
              />
            ) : (
              <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-300">
                <span className="text-4xl block mb-4">📭</span>
                <p className="text-gray-500 font-bold text-lg">No products match your search.</p>
              </div>
            )}
          </main>
        </motion.div>
      )}

      {/* MANAGER VIEW */}
      {view === 'manager' && userRole === 'Manager' && (
        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto bg-white p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
          
          <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Manager Dashboard</h2>
            <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200">
              <button onClick={() => setManagerTab('inventory')} className={`px-6 py-2.5 font-bold rounded-lg transition-all ${managerTab === 'inventory' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>📦 Inventory</button>
              <button onClick={() => setManagerTab('sales')} className={`px-6 py-2.5 font-bold rounded-lg transition-all ${managerTab === 'sales' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>📈 Sales Analytics</button>
              <button onClick={() => setManagerTab('staff')} className={`px-6 py-2.5 font-bold rounded-lg transition-all ${managerTab === 'staff' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>👥 Staff Management</button>
            </div>
          </div>

          {/* SUB-TAB 1: INVENTORY */}
          {managerTab === 'inventory' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              
              {/* ✨ UPDATED ADD PRODUCT FORM WITH IMAGE URL INPUT */}
              <form onSubmit={handleAddProduct} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 shadow-inner">
                <input type="text" placeholder="Product Name" required className="p-3.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
                <input type="text" placeholder="Category" required className="p-3.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
                <input type="number" placeholder="Price (₹)" required min="0" step="0.01" className="p-3.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
                <input type="number" placeholder="Stock" required min="1" className="p-3.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} />
                <input type="text" placeholder="Image URL (http...)" className="p-3.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm" value={newProduct.imageUrl} onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})} />
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all shadow-md">Add</button>
              </form>

              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-gray-200">SKU ID</th>
                      <th className="p-4 font-bold border-b border-gray-200">Name</th>
                      <th className="p-4 font-bold border-b border-gray-200">Category</th>
                      <th className="p-4 font-bold border-b border-gray-200">Price</th>
                      <th className="p-4 font-bold border-b border-gray-200">Stock</th>
                      <th className="p-4 font-bold border-b border-gray-200 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id} className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors">
                        <td className="p-4 text-xs font-mono text-gray-400">{p._id.substring(0,8)}</td>
                        <td className="p-4 font-bold text-gray-800">{p.name}</td>
                        <td className="p-4 text-sm text-gray-500">{p.category}</td>
                        <td className="p-4 text-green-600 font-black">{formatINR(p.price)}</td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {p.stock} units
                          </span>
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => handleRestock(p._id, p.stock)}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-700 active:scale-95 px-3 py-1.5 rounded-lg font-bold text-xs transition-all"
                          >
                            + Restock
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p._id)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 active:scale-95 px-3 py-1.5 rounded-lg font-bold text-xs transition-all"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* SUB-TAB 2: SALES ANALYTICS */}
          {managerTab === 'sales' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100 p-12 rounded-3xl text-center">
              <div className="text-6xl mb-6">📈</div>
              <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Live Sales Feed</h3>
              <p className="text-gray-500 mb-10 font-medium">Real-time transaction monitoring for current session.</p>
              
              {lastOrder ? (
                 <div className="bg-white p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white inline-block text-left min-w-[350px]">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                      <span className="text-gray-400 font-black text-xs tracking-widest uppercase">Latest Order</span>
                      <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Completed</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-1">Invoice Ref: <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{lastOrder.id}</span></p>
                    <p className="text-xs text-gray-400 font-medium mb-6">{lastOrder.date}</p>
                    
                    <div className="flex justify-between items-end mt-4 pt-6 border-t border-dashed border-gray-200">
                      <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">Revenue Captured</span>
                      <span className="text-4xl font-black text-green-600 tracking-tight">{formatINR(lastOrder.total)}</span>
                    </div>
                    
                    <button onClick={handleRefund} className="w-full mt-8 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white active:scale-95 font-bold py-3.5 rounded-xl transition-all border border-red-200 hover:border-transparent hover:shadow-lg">
                      🛑 Void Transaction & Restock
                    </button>
                 </div>
              ) : (
                 <div className="bg-white/60 backdrop-blur-sm p-10 rounded-2xl border-2 border-dashed border-blue-200 max-w-md mx-auto">
                    <p className="text-blue-900 font-bold text-lg">Awaiting transactions...</p>
                    <p className="text-sm text-blue-600/70 mt-2 font-medium">Process a checkout in the Cashier Terminal to see live data populate here.</p>
                 </div>
              )}
              <div className="mt-12">
  <InventoryChart products={products} />
</div>
            </motion.div>
          )}

          {/* SUB-TAB 3: STAFF MANAGEMENT */}
          {managerTab === 'staff' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 rounded-3xl border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] max-w-2xl mx-auto">
              <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                <div className="bg-green-100 p-3 rounded-2xl text-2xl">🛡️</div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Security Registration</h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">Provision encrypted access for new employees.</p>
                </div>
              </div>
              
              <form onSubmit={handleRegisterStaff} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Legal Name</label>
                    <input type="text" required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-shadow" value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">System Clearance</label>
                    <select className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-shadow" value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                      <option value="Cashier">Level 1 - Cashier</option>
                      <option value="Manager">Level 2 - Manager</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Corporate Email</label>
                  <input type="email" required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-shadow" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="employee@infotact.com" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Temporary Password</label>
                  <input type="password" required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-shadow" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} placeholder="••••••••" />
                </div>
                
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 active:scale-95 text-white font-black py-4 px-4 rounded-xl transition-all shadow-[0_10px_20px_rgba(22,163,74,0.2)] hover:shadow-[0_10px_25px_rgba(22,163,74,0.3)] mt-4">
                  Provision Account
                </button>
              </form>
            </motion.div>
          )}
        </motion.main> 
      )}

      {/* ✨ ANIMATED TENDER CALCULATOR MODAL */}
      <AnimatePresence>
        {showTenderModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] max-w-md w-full overflow-hidden flex flex-col p-8 border border-white/20"
            >
              <div className="text-center mb-6">
                <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">💳</div>
                <h2 className="text-2xl font-black text-gray-900">Payment Tender</h2>
              </div>
              
              <div className="flex justify-between items-center text-lg mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <span className="text-gray-500 font-bold uppercase tracking-wider text-sm">Total Due</span>
                <span className="font-black text-2xl text-red-600">{formatINR(cart?.totalAmount)}</span>
              </div>

              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">Cash Received (₹)</label>
                <input type="number" min="0" className="w-full p-4 bg-white border-2 border-blue-100 rounded-2xl outline-none focus:border-blue-500 text-3xl font-black text-center text-blue-900 transition-colors shadow-inner" placeholder="0.00" value={amountTendered} onChange={(e) => setAmountTendered(e.target.value)} autoFocus />
              </div>

              <div className="flex justify-between items-center text-xl mb-8 border-t border-dashed border-gray-200 pt-6">
                <span className="text-gray-500 font-bold uppercase tracking-wider text-sm">Change Due</span>
                <span className={`font-black text-3xl ${Number(amountTendered) >= cart?.totalAmount ? 'text-green-600' : 'text-gray-300'}`}>
                  {amountTendered && Number(amountTendered) >= cart?.totalAmount ? formatINR(Number(amountTendered) - cart?.totalAmount) : "₹0.00"}
                </span>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setShowTenderModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 font-bold py-4 rounded-xl transition-all">Cancel</button>
                <button onClick={() => { setShowTenderModal(false); handleCheckout(); setAmountTendered(''); }} disabled={Number(amountTendered) < cart?.totalAmount} className={`flex-1 font-black py-4 rounded-xl transition-all active:scale-95 ${Number(amountTendered) >= cart?.totalAmount ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_10px_20px_rgba(22,163,74,0.3)]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Confirm Payment</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✨ ANIMATED PRINTABLE RECEIPT MODAL */}
      <AnimatePresence>
        {showReceipt && lastOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 print:bg-white print:p-0"
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="bg-white max-w-sm w-full flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.5)] print:shadow-none print:max-w-full"
              style={{
                clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), 95% 100%, 90% calc(100% - 10px), 85% 100%, 80% calc(100% - 10px), 75% 100%, 70% calc(100% - 10px), 65% 100%, 60% calc(100% - 10px), 55% 100%, 50% calc(100% - 10px), 45% 100%, 40% calc(100% - 10px), 35% 100%, 30% calc(100% - 10px), 25% 100%, 20% calc(100% - 10px), 15% 100%, 10% calc(100% - 10px), 5% 100%, 0 calc(100% - 10px))"
              }}
            >
              <div className="p-8 font-mono text-gray-800 bg-white" id="printable-bill">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-black tracking-widest uppercase mb-1">INFOTACT</h2>
                  <p className="text-[10px] font-bold tracking-widest uppercase border-b border-gray-800 pb-2 mb-2">Point of Sale System</p>
                  <p className="text-xs mt-2">123 Tech Avenue, Silicon City</p>
                  <p className="text-xs">Phone: +91 98765 43210</p>
                  <p className="text-sm mt-4 font-bold uppercase border-y-2 border-dashed border-gray-400 py-1.5 bg-gray-50">Tax Invoice (Cash)</p>
                </div>
                
                <div className="text-xs mb-6 bg-gray-50 p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">Bill No:</span><span className="font-bold">{lastOrder.id.replace('INV-', '')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span><span className="font-bold">{lastOrder.date}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500">Cashier:</span><span className="font-bold uppercase">{userRole}</span>
                  </div>
                </div>
                
                <table className="w-full text-left text-xs mb-6">
                  <thead>
                    <tr className="border-b-2 border-gray-800">
                      <th className="py-2 w-1/2 font-bold text-gray-500">ITEM</th><th className="py-2 text-center font-bold text-gray-500">QTY</th><th className="py-2 text-right font-bold text-gray-500">RATE</th><th className="py-2 text-right font-bold text-gray-500">AMT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastOrder.items.map((item, index) => {
                      const qty = item.quantity || 1; 
                      const rate = item.price;
                      const amount = qty * rate;
                      return (
                        <tr key={index} className="border-b border-dotted border-gray-300">
                          <td className="py-3 pr-2 font-bold">{item.name}</td><td className="py-3 text-center">{qty}</td><td className="py-3 text-right">{rate.toFixed(2)}</td><td className="py-3 text-right font-black">{amount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                <div className="border-t-2 border-gray-800 pt-3 mb-8">
                  <div className="flex justify-between items-center text-xl font-black">
                    <span>TOTAL:</span><span>{formatINR(lastOrder.total)}</span>
                  </div>
                </div>
                
                <div className="text-center border-t border-dashed border-gray-400 pt-6 pb-4">
                  <p className="text-xs font-bold uppercase tracking-wider">Thank you for shopping!</p>
                  <p className="text-[10px] text-gray-500 mt-1">Please visit again.</p>
                  <div className="mt-4 flex justify-center">
                    <div className="w-48 h-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMCAwaDJ2MTAwaC0yek00IDBoMXYxMDBoLTF6TTEwIDBoM3YxMDBoLTN6TTE0IDBoMXYxMDBoLTF6TTE3IDBoMnYxMDBoLTJ6TTIxIDBoMXYxMDBoLTF6TTI0IDBoMnYxMDBoLTJ6TTI4IDBoM3YxMDBoLTN6TTM0IDBoMXYxMDBoLTF6TTM3IDBoMnYxMDBoLTJ6TTQxIDBoM3YxMDBoLTN6TTQ1IDBoMXYxMDBoLTF6TTQ4IDBoMnYxMDBoLTJ6TTUyIDBoMXYxMDBoLTF6TTU0IDBoM3YxMDBoLTN6TTU5IDBoMXYxMDBoLTF6TTYyIDBoMnYxMDBoLTJ6TTY2IDBoM3YxMDBoLTN6TTcwIDBoMXYxMDBoLTF6TTcyIDBoMnYxMDBoLTJ6TTc2IDBoM3YxMDBoLTN6TTgxIDBoMXYxMDBoLTF6TTg0IDBoMnYxMDBoLTJ6TTg4IDBoM3YxMDBoLTN6TTkyIDBoMXYxMDBoLTF6TTk0IDBoMnYxMDBoLTJ6TTk3IDBoMXYxMDBoLTF6IiBmaWxsPSIjMDAwIi8+PC9zdmc+')] opacity-50"></div>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-2 font-mono">{lastOrder.id}</p>
                </div>
              </div>

              <div className="p-5 bg-gray-50 flex gap-3 print:hidden border-t-2 border-dashed border-gray-200">
                <button onClick={() => window.print()} className="flex-1 bg-gray-900 hover:bg-black active:scale-95 text-white font-black uppercase tracking-wider py-4 rounded-xl transition-all shadow-[0_5px_15px_rgba(0,0,0,0.2)]">🖨️ Print Receipt</button>
                <button onClick={() => setShowReceipt(false)} className="flex-1 bg-white border-2 border-red-100 hover:border-red-500 active:scale-95 text-red-600 font-black uppercase tracking-wider py-4 rounded-xl transition-all">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div> 
  ); 
} 

export default App;  