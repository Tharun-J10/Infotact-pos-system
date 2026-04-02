import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from './store/cartSlice';
import axios from 'axios';

function App() {
  // --- AUTHENTICATION STATE ---
  const [token, setToken] = useState('dev-mode-override');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- APP STATE ---
  const [products, setProducts] = useState([]);
  const [view, setView] = useState('pos');
  
  // ✅ FIXED: Added 'category' to the initial state
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '' });

  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  // Fetch products (Only runs if logged in or in dev-mode)
  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products", err);
    }
  };

  useEffect(() => {
    if (token) fetchProducts();
  }, [token]);

  // --- LOGIN LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/users/login', { email, password });
      const receivedToken = res.data.token;
      
      setToken(receivedToken);
      localStorage.setItem('token', receivedToken); // Saves it so you don't log out on refresh
    } catch (err) {
      alert("Login failed! Check your credentials or terminal.");
      console.error(err);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
  };

  // --- ADD PRODUCT LOGIC (NOW WITH SECURITY & CATEGORY) ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/products', {
        name: newProduct.name,
        category: newProduct.category, // ✅ FIXED: Sending category to MongoDB
        price: Number(newProduct.price),
        stock: Number(newProduct.stock)
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      // ✅ FIXED: Resetting the category field after saving
      setNewProduct({ name: '', category: '', price: '', stock: '' });
      fetchProducts();
      alert("Success! The product was saved to MongoDB.");
    } catch (err) {
      console.error("Failed to add product", err);
      // Shows the real error from the backend
      alert("Real Error: " + (err.response?.data?.message || err.message));
    }
  };

  // ==========================================
  // VIEW 1: THE LOGIN SCREEN (If no token)
  // ==========================================
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-6 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
          <div className="text-center mb-8">
            <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🔒
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Infotact Security</h2>
            <p className="text-gray-500 text-sm mt-2">Enter manager credentials to access POS</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <input 
                type="email" required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@store.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input 
                type="password" required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              Secure Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: THE MAIN SYSTEM (If logged in)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-700 tracking-tight">INFOTACT POS</h1>
          <div className="mt-2 flex gap-2">
            <button onClick={() => setView('pos')} className={`px-4 py-1 text-sm font-bold rounded ${view === 'pos' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
              Cashier Terminal
            </button>
            <button onClick={() => setView('manager')} className={`px-4 py-1 text-sm font-bold rounded ${view === 'manager' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
              Manager Dashboard
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {view === 'pos' && (
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-2xl">🛒</span>
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">{cart.items.length}</span>
              </div>
              <p className="text-lg font-bold text-gray-800 mt-1">Total: <span className="text-green-600">${cart.totalAmount.toFixed(2)}</span></p>
            </div>
          )}
          <button onClick={handleLogout} className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded font-bold text-sm transition">
            Logout
          </button>
        </div>
      </header>

      {/* POS VIEW */}
      {view === 'pos' && (
        <main className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.length > 0 ? products.map((product) => (
            <div key={product._id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 flex flex-col p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Stock: {product.stock}</span>
              </div>
              {/* Added category display to the card */}
              <p className="text-sm text-gray-500 mb-4">{product.category}</p>
              
              <div className="flex justify-between items-center mt-auto">
                <span className="text-2xl font-black text-gray-900">${product.price}</span>
                <button 
                  onClick={() => dispatch(addToCart({ productId: product._id, name: product.name, price: product.price }))}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
                >
                  + Add
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-20 bg-white rounded border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">No products. Use Manager Dashboard to add stock.</p>
            </div>
          )}
        </main>
      )}

      {/* MANAGER VIEW */}
      {view === 'manager' && (
        <main className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Inventory Management</h2>
          
          {/* ✅ FIXED: Changed to grid-cols-5 and added the Category input box */}
          <form onSubmit={handleAddProduct} className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
            <input type="text" placeholder="Name" required className="p-3 border rounded outline-none" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
            <input type="text" placeholder="Category" required className="p-3 border rounded outline-none" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
            <input type="number" placeholder="Price ($)" required min="0" step="0.01" className="p-3 border rounded outline-none" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
            <input type="number" placeholder="Stock" required min="1" className="p-3 border rounded outline-none" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} />
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg">Save Product</button>
          </form>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th> {/* ✅ FIXED: Added Category Header */}
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-mono text-gray-500">{p._id.substring(0,8)}...</td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-500">{p.category}</td> {/* ✅ FIXED: Display Category */}
                  <td className="p-3 text-green-600 font-bold">${p.price}</td>
                  <td className="p-3">{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      )}
    </div>
  );
}

export default App;