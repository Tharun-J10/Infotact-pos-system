import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, clearCart } from "./store/cartSlice";
import axios from "axios";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);
  const [view, setView] = useState("pos");
  const [search, setSearch] = useState("");

  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
  });

  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  const formatINR = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchProducts();
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
    } catch (err) {
      alert("Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  const handleCheckout = async () => {
    if (!cart.items.length) return alert("Cart empty!");

    try {
      await axios.post(
        "http://localhost:5000/api/products/checkout",
        {
          orderItems: cart.items,
          totalPrice: cart.totalAmount,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLastOrder({
        items: cart.items,
        total: cart.totalAmount,
        date: new Date().toLocaleString(),
      });

      setShowReceipt(true);
      dispatch(clearCart());
      fetchProducts();
    } catch {
      alert("Checkout failed");
    }
  };

  // LOGIN UI
  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <form className="bg-white p-8 rounded-xl shadow-lg w-80">
          <h2 className="text-2xl mb-4 text-center font-bold">Login</h2>

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border mb-3 rounded-lg"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border mb-3 rounded-lg"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  // MAIN UI
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        POS Billing System
      </h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView("pos")}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          POS
        </button>

        <button
          onClick={() => setView("manager")}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg"
        >
          Manager
        </button>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg ml-auto"
        >
          Logout
        </button>
      </div>

      {view === "pos" && (
        <input
          placeholder="Search..."
          className="w-full p-3 mb-4 border rounded-lg"
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PRODUCTS */}
        {view === "pos" && (
          <div className="md:col-span-2">
            {products
              .filter((p) =>
                p.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((p) => (
                <div
                  key={p._id}
                  className="bg-white p-4 mb-3 rounded-xl shadow hover:shadow-lg"
                >
                  <h3 className="font-semibold">{p.name}</h3>
                  <p>{formatINR(p.price)}</p>

                  <button
                    onClick={() =>
                      dispatch(
                        addToCart({
                          productId: p._id,
                          name: p.name,
                          price: p.price,
                        })
                      )
                    }
                    className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
                  >
                    Add
                  </button>
                </div>
              ))}
          </div>
        )}

        {/* CART */}
        {view === "pos" && (
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-bold mb-2">Cart</h2>

            {cart.items.map((item, i) => (
              <div key={i} className="flex justify-between mb-1">
                <span>{item.name}</span>
                <span>{formatINR(item.price)}</span>
              </div>
            ))}

            <h3 className="font-bold mt-2">
              {formatINR(cart.totalAmount)}
            </h3>

            <button
              onClick={handleCheckout}
              className="bg-blue-500 text-white w-full mt-2 py-2 rounded"
            >
              Checkout
            </button>
          </div>
        )}

        {/* MANAGER */}
        {view === "manager" && (
          <form className="bg-white p-4 rounded-xl shadow">
            <input
              placeholder="Name"
              className="w-full p-2 border mb-2"
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
            />
            <input
              placeholder="Price"
              type="number"
              className="w-full p-2 border mb-2"
              onChange={(e) =>
                setNewProduct({ ...newProduct, price: e.target.value })
              }
            />
            <button className="bg-green-500 text-white w-full py-2 rounded">
              Add Product
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;