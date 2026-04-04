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

  // 💰 FORMAT INR
  const formatINR = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  // FETCH PRODUCTS
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

  // ✅ LOGIN FIXED
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
      console.log(err.response?.data);
      alert(err.response?.data?.message || "Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  // CHECKOUT
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

  // 🔐 LOGIN UI
  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded shadow w-80"
        >
          <h2 className="text-2xl mb-4 text-center font-bold">Login</h2>

          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border mb-3 rounded"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border mb-3 rounded"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="w-full bg-blue-500 text-white py-2 rounded">
            Login
          </button>
        </form>
      </div>
    );
  }

  // 🧾 MAIN UI
  return (
    <div className="p-5 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-blue-600">
        POS Billing System
      </h1>

      <div className="mb-3">
        <button
          onClick={() => setView("pos")}
          className="bg-gray-500 text-white px-3 py-1 rounded mr-2"
        >
          POS
        </button>

        <button
          onClick={() => setView("manager")}
          className="bg-purple-500 text-white px-3 py-1 rounded mr-2"
        >
          Manager
        </button>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>

      {/* SEARCH */}
      {view === "pos" && (
        <input
          type="text"
          placeholder="Search product..."
          className="w-full p-2 mb-3 border rounded"
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* PRODUCTS */}
        {view === "pos" && (
          <div className="col-span-2">
            <h2 className="font-bold mb-2">Products</h2>

            {products
              .filter((p) =>
                p.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((p) => (
                <div
                  key={p._id}
                  className="bg-white p-4 mb-3 rounded-lg shadow"
                >
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-gray-600">{formatINR(p.price)}</p>

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
                    Add to Cart
                  </button>
                </div>
              ))}
          </div>
        )}

        {/* CART */}
        {view === "pos" && (
          <div>
            <h2 className="font-bold mb-2">Cart</h2>

            {cart.items.length === 0 && (
              <p className="text-gray-500">Cart is empty</p>
            )}

            {cart.items.map((item, i) => (
              <div key={i} className="bg-white p-2 mb-2 rounded shadow">
                {item.name} - {formatINR(item.price)}
              </div>
            ))}

            <h3 className="font-bold mt-2">
              Total: {formatINR(cart.totalAmount)}
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
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await axios.post(
                "http://localhost:5000/api/products",
                {
                  name: newProduct.name,
                  price: Number(newProduct.price),
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              setNewProduct({ name: "", price: "" });
              fetchProducts();
              alert("Product added!");
            }}
            className="bg-white p-4 rounded shadow w-80"
          >
            <h2 className="font-bold mb-2">Add Product</h2>

            <input
              placeholder="Name"
              className="w-full p-2 border mb-2"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
            />

            <input
              placeholder="Price"
              type="number"
              className="w-full p-2 border mb-2"
              value={newProduct.price}
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

      {/* RECEIPT */}
      {showReceipt && lastOrder && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-80 shadow-lg">
            <h2 className="text-xl font-bold text-center mb-3">
              🧾 Receipt
            </h2>

            {lastOrder.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm mb-1">
                <span>{item.name}</span>
                <span>{formatINR(item.price)}</span>
              </div>
            ))}

            <div className="flex justify-between font-bold mt-2">
              <span>Total</span>
              <span>{formatINR(lastOrder.total)}</span>
            </div>

            <p className="text-xs text-center mt-2 text-gray-500">
              {lastOrder.date}
            </p>

            <button
              onClick={() => setShowReceipt(false)}
              className="mt-4 bg-blue-500 text-white w-full py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;