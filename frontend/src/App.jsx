import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, clearCart } from './store/cartSlice';
import axios from 'axios';

function App() {
  // --- AUTHENTICATION STATE ---
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- APP STATE ---
  const [products, setProducts] = useState([]);
  const [view, setView] = useState('pos');
  const [managerTab, setManagerTab] = useState('inventory');
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '' });
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

  // --- LOGIN LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const receivedToken = res.data.token;
      
      setToken(receivedToken);
      localStorage.setItem('token', receivedToken);
    } catch (err) {
      alert("Login failed! Check your credentials or terminal.");
      console.error(err);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
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
        barcode: "SKU-" + Date.now() 
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setNewProduct({ name: '', category: '', price: '', stock: '' });
      fetchProducts();
      alert("Success! The product was saved to MongoDB.");
    } catch (err) {
      console.error("Failed to add product", err);
      const deepError = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      alert("Database Error: " + deepError);
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

  // --- CHECKOUT LOGIC (NOW TRIGGERS RECEIPT) ---
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
      setLastOrder(null); // Clear the canceled order from the screen
      fetchProducts(); // Refresh the inventory UI
      
    } catch (err) {
      console.error("Refund failed", err);
      alert("Refund Error: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==========================================
  // VIEW 1: THE LOGIN SCREEN 
  // ==========================================
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-6 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
          <div className="text-center mb-8">
            <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔒</div>
            <h2 className="text-2xl font-extrabold text-gray-900">Infotact Security</h2>
            <p className="text-gray-500 text-sm mt-2">Enter manager credentials to access POS</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <input type="email" required className="w-full p-3 border border-gray-300 rounded-lg outline-none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="manager@store.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input type="password" required className="w-full p-3 border border-gray-300 rounded-lg outline-none" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Secure Login</button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: THE MAIN SYSTEM
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans relative">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-700 tracking-tight">INFOTACT POS</h1>
          <div className="mt-2 flex gap-2">
            <button onClick={() => setView('pos')} className={`px-4 py-1 text-sm font-bold rounded ${view === 'pos' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Cashier Terminal</button>
            <button onClick={() => setView('manager')} className={`px-4 py-1 text-sm font-bold rounded ${view === 'manager' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Manager Dashboard</button>
          </div>
        </div>
        
        <div className="flex items-start gap-6">
          {view === 'pos' && (
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-2xl">🛒</span>
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">{cart?.items?.length || 0}</span>
              </div>
              <p className="text-lg font-bold text-gray-800 mt-1 mb-2">
                Total: <span className="text-green-600">{formatINR(cart?.totalAmount)}</span>
              </p>
              <button onClick={handleOpenTender} className="bg-green-500 hover:bg-green-600 text-white font-extrabold py-2 px-4 rounded shadow-md w-full transition-colors">
                Complete Checkout
              </button>
            </div>
          )}
          <button onClick={handleLogout} className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded font-bold text-sm transition">Logout</button>
        </div>
      </header>

      {/* POS VIEW */}
      {view === 'pos' && (
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <input 
              type="text" 
              placeholder="🔍 Search products by name or category..." 
              className="w-full p-4 rounded-xl border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.length > 0 ? filteredProducts.map((product) => (
              <div key={product._id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 flex flex-col p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Stock: {product.stock}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{product.category}</p>
                
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-2xl font-black text-gray-900">{formatINR(product.price)}</span>
                  
                  <button 
                    onClick={() => {
                      dispatch(addToCart({ productId: product._id, name: product.name, price: product.price }));
                    }}
                    disabled={product.stock <= 0}
                    className={`font-bold py-2 px-6 rounded-lg transition-colors ${
                      product.stock <= 0 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {product.stock <= 0 ? 'Out of Stock' : '+ Add'}
                  </button>

                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-20 bg-white rounded border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">No products match your search.</p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* MANAGER VIEW */}
      {view === 'manager' && (
        <main className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-100">
          
          {/* THE NEW TOGGLE TABS */}
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800">Manager Dashboard</h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setManagerTab('inventory')}
                className={`px-6 py-2 font-bold rounded-md transition-colors ${managerTab === 'inventory' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                📦 Inventory
              </button>
              <button 
                onClick={() => setManagerTab('sales')}
                className={`px-6 py-2 font-bold rounded-md transition-colors ${managerTab === 'sales' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                📈 Sales Analytics
              </button>
              <button 
                onClick={() => setManagerTab('staff')}
                className={`px-6 py-2 font-bold rounded-md transition-colors ${managerTab === 'staff' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                👥 Staff Management
              </button>
            </div>
          </div>

          {/* SUB-TAB 1: INVENTORY */}
          {managerTab === 'inventory' && (
            <div className="animate-fade-in">
              <form onSubmit={handleAddProduct} className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
                <input type="text" placeholder="Name" required className="p-3 border rounded outline-none" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
                <input type="text" placeholder="Category" required className="p-3 border rounded outline-none" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
                <input type="number" placeholder="Price (₹)" required min="0" step="0.01" className="p-3 border rounded outline-none" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
                <input type="number" placeholder="Stock" required min="1" className="p-3 border rounded outline-none" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} />
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg">Save Product</button>
              </form>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600">
                    <th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p._id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-sm font-mono text-gray-500">{p._id.substring(0,8)}...</td>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-gray-500">{p.category}</td>
                      <td className="p-3 text-green-600 font-bold">{formatINR(p.price)}</td>
                      <td className="p-3">{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SUB-TAB 2: SALES ANALYTICS */}
          {managerTab === 'sales' && (
            <div className="bg-blue-50 border border-blue-100 p-10 rounded-xl text-center animate-fade-in">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Live Sales Feed</h3>
              <p className="text-gray-500 mb-8">Monitoring transactions for the current session.</p>
              
              {lastOrder ? (
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 inline-block text-left min-w-[300px]">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                      <span className="text-gray-500 font-bold text-sm">LATEST TRANSACTION</span>
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">Completed</span>
                    </div>
                    <p className="text-gray-500 mb-1">Invoice: <span className="font-mono text-gray-800">{lastOrder.id}</span></p>
                    <p className="text-sm text-gray-400 mb-4">{lastOrder.date}</p>
                    
                    <div className="flex justify-between items-end mt-4 pt-4 border-t border-dashed border-gray-200">
                      <span className="text-gray-600 font-bold">Revenue:</span>
                      <span className="text-3xl font-black text-green-600">{formatINR(lastOrder.total)}</span>
                    </div>
                    
                    {/* ✅ THE REFUND BUTTON IS SAFELY PLACED HERE */}
                    <button 
                      onClick={handleRefund}
                      className="w-full mt-6 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold py-3 rounded-lg transition-colors border border-red-200 hover:border-red-600"
                    >
                      🛑 Cancel Transaction & Restock
                    </button>

                 </div>
              ) : (
                 <div className="bg-white p-8 rounded-xl border-2 border-dashed border-gray-200 max-w-md mx-auto">
                    <p className="text-gray-500 font-medium">No sales recorded in this session yet.</p>
                    <p className="text-sm text-gray-400 mt-2">Go to the Cashier Terminal and complete a checkout to see live data populate here!</p>
                 </div>
              )}
            </div>
          )}

          {/* SUB-TAB 3: STAFF MANAGEMENT */}
          {managerTab === 'staff' && (
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm animate-fade-in max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <span className="text-3xl">👤</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Register New Staff Member</h3>
                  <p className="text-sm text-gray-500">Create secure accounts for new cashiers or managers.</p>
                </div>
              </div>
              
              <form onSubmit={handleRegisterStaff} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                    <input type="text" required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">System Role</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white" value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                      <option value="Cashier">Cashier (Terminal Only)</option>
                      <option value="Manager">Manager (Full Access)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input type="email" required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="employee@infotact.com" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Temporary Password</label>
                  <input type="password" required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} placeholder="••••••••" />
                </div>
                
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2">
                  Create Account
                </button>
              </form>
            </div>
          )}

        </main> 
      )}

      {/* TENDER CALCULATOR MODAL */}
      {showTenderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Payment Tender</h2>
            
            <div className="flex justify-between text-lg mb-4">
              <span className="text-gray-600">Total Due:</span>
              <span className="font-bold text-red-600">{formatINR(cart?.totalAmount)}</span>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Cash Received (₹)</label>
              <input 
                type="number" 
                min="0"
                className="w-full p-4 border border-gray-300 rounded-lg outline-none text-xl font-bold text-center"
                placeholder="0.00"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex justify-between text-xl mb-8 border-t border-gray-200 pt-4">
              <span className="text-gray-600 font-bold">Change Due:</span>
              <span className={`font-black ${Number(amountTendered) >= cart?.totalAmount ? 'text-green-600' : 'text-gray-400'}`}>
                {amountTendered && Number(amountTendered) >= cart?.totalAmount 
                  ? formatINR(Number(amountTendered) - cart?.totalAmount) 
                  : "₹0.00"}
              </span>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowTenderModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowTenderModal(false);
                  handleCheckout();
                  setAmountTendered(''); 
                }} 
                disabled={Number(amountTendered) < cart?.totalAmount}
                className={`flex-1 font-bold py-3 rounded-lg transition-colors ${
                  Number(amountTendered) >= cart?.totalAmount 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THE PRINTABLE RECEIPT MODAL */}
      {showReceipt && lastOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="bg-gray-50 p-6 border-b border-gray-200 text-center">
              <h2 className="text-2xl font-black text-gray-900 tracking-widest">INFOTACT</h2>
              <p className="text-gray-500 text-sm mt-1">Official Retail Receipt</p>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between text-sm text-gray-600 mb-6">
                <div><span className="font-bold">Invoice:</span><br/>{lastOrder.id}</div>
                <div className="text-right"><span className="font-bold">Date:</span><br/>{lastOrder.date}</div>
              </div>
              
              <div className="border-t border-b border-dashed border-gray-300 py-4 mb-6">
                <div className="flex justify-between font-bold text-gray-800 mb-2">
                  <span>Item</span>
                  <span>Price</span>
                </div>
                {lastOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{item.name}</span>
                    <span>{formatINR(item.price)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-xl font-black text-gray-900">
                <span>TOTAL</span>
                <span className="text-green-600">{formatINR(lastOrder.total)}</span>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-4">
              <button onClick={() => window.print()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
                🖨️ Print Bill
              </button>
              <button onClick={() => setShowReceipt(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;