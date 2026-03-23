const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { 
    family: 4
})
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// Test route
app.get('/', (req, res) => {
    res.send("POS Backend is Live and Connected!");
});

// Start server
const PORT = process.env.PORT || 5000;
// Add this line to parse incoming JSON data (Crucial!)
app.use(express.json());
const authRoutes = require('./routes/authRoutes');
// Import and use the new product routes
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
// Import and use the new sales routes
const saleRoutes = require('./routes/saleRoutes');
app.use('/api/sales', saleRoutes);
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));