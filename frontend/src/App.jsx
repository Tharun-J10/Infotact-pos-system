import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from './store/cartSlice';
import axios from 'axios';

function App() {
  const [products, setProducts] = useState([]);
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  // Fetch products from your backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products');
        setProducts(res.data);
      } catch (err) {
        console.error("Error fetching products", err);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header with Cart Stats */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-700 tracking-tight">INFOTACT POS</h1>
          <p className="text-gray-500 text-sm">Welcome back, James</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-2xl">🛒</span>
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {cart.items.length}
            </span>
          </div>
          <p className="text-lg font-bold text-gray-800 mt-1">
            Total: <span className="text-green-600">${cart.totalAmount.toFixed(2)}</span>
          </p>
        </div>
      </header>

      {/* Product Grid */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product._id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col">
              <div className="h-32 bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
                 <span className="text-4xl text-white opacity-50">📦</span>
              </div>
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase">
                    In Stock
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-4">SKU: {product._id.substring(0,8)}</p>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-2xl font-black text-gray-900">${product.price}</span>
                  <button 
                    onClick={() => dispatch(addToCart({ 
                      productId: product._id, 
                      name: product.name, 
                      price: product.price 
                    }))}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No products found in database.</p>
            <p className="text-sm text-gray-400">Use Thunder Client or create a Product CRUD page to add items.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;