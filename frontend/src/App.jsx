import { useState } from 'react';

function App() {
  // --- STATE ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  // --- LOGIN FUNCTION ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setIsLoggedIn(true); // This magically flips the screen to the Dashboard!
      } else {
        alert('❌ Login Failed: ' + (data.message || 'Check credentials'));
      }
    } catch (error) {
      alert('❌ Connection Error. Is your backend running?');
    }
  };

  // --- CHECKOUT FUNCTION (The Week 2 Engine!) ---
  const handleCheckout = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token'); // Grab the security badge!

    try {
      // Make sure this matches your actual backend route (e.g., /api/sales, /api/orders, etc.)
      const response = await fetch('http://localhost:5000/api/sales', { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Show the badge to the backend!
        },
        body: JSON.stringify({ productId, quantity: Number(quantity) })
      });
      const data = await response.json();

      if (response.ok) {
        alert('🛒 Atomic Transaction Complete! Bill Generated Successfully.');
        setProductId(''); // Clear the form
        setQuantity(1);
      } else {
        alert('❌ Checkout Failed: ' + (data.message || 'Check stock/ID'));
      }
    } catch (error) {
      alert('❌ Connection Error during checkout.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  // --- UI: CASHIER DASHBOARD (If logged in) ---
  if (isLoggedIn) {
    return (
      <div style={{ padding: '50px', fontFamily: 'sans-serif', backgroundColor: '#f4f4f9', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '400px', marginBottom: '20px' }}>
          <h2>🛒 Cashier Dashboard</h2>
          <button onClick={handleLogout} style={{ padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
        </div>

        <div style={{ background: 'white', border: '1px solid #ccc', padding: '20px', width: '360px', borderRadius: '8px', boxShadow: '0px 4px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: '0' }}>Process New Sale</h3>
          <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column' }}>
            
            <label style={{ fontWeight: 'bold' }}>Product ID:</label>
            <input 
              type="text" 
              placeholder="Paste MongoDB Object ID here"
              value={productId} 
              onChange={(e) => setProductId(e.target.value)} 
              required 
              style={{ marginBottom: '15px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />

            <label style={{ fontWeight: 'bold' }}>Quantity:</label>
            <input 
              type="number" 
              min="1" 
              value={quantity} 
              onChange={(e) => setQuantity(e.target.value)} 
              required 
              style={{ marginBottom: '20px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />

            <button type="submit" style={{ padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
              Complete Checkout
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- UI: LOGIN SCREEN (If NOT logged in) ---
  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h2>Infotact POS - Cashier Login</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', width: '300px' }}>
        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ marginBottom: '15px', padding: '8px' }} />
        <label>Password:</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ marginBottom: '15px', padding: '8px' }} />
        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Login to POS</button>
      </form>
    </div>
  );
}

export default App;