const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorMiddleware'); // ✅ added

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // ✅ keep only once

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { family: 4 })
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// Test route
app.get('/', (req, res) => {
  res.send("POS Backend is Live and Connected!");
});

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sales', saleRoutes);

// ✅ Error Handler (VERY IMPORTANT - keep here)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));