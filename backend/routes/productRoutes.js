const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/authMiddleware');
// const redisClient = require('../config/redisClient'); // Temporarily bypassed

/**
 * @swagger
 * /api/products:
 * get:
 * summary: Get all products
 * tags: [Products]
 */

// 🔒 FINAL: Added protect back
router.get('/', protect, async (req, res) => {
    try {
        // --- REDIS BYPASSED ---
        // const cachedData = await redisClient.get('all_products');
        // if (cachedData) { ... }

        console.log("📦 Serving directly from MongoDB");
        const products = await Product.find();
        
        // await redisClient.setEx(...);

        res.json(products);
    } catch (error) {
        console.error("GET Products Error:", error); 
        res.status(500).json({ message: "Failed to fetch products" });
    }
});

/**
 * Add product
 */
router.post('/', protect, authorize('Manager', 'System Administrator'), async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();

        // await redisClient.del('all_products'); // Temporarily bypassed

        console.log("✅ Product added to MongoDB!");
        res.status(201).json(savedProduct);

    } catch (error) {
        console.error("POST Product Error:", error); 
        res.status(500).json({ message: "Failed to add product", error });
    }
});

/**
 * Checkout
 */
router.post('/checkout', protect, async (req, res) => {
    try {
        const { orderItems } = req.body;

        for (let item of orderItems) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
        }

        // await redisClient.del('all_products'); // Temporarily bypassed

        console.log("🛒 Checkout successful!");
        res.status(200).json({
            message: "Transaction Complete! Stock updated."
        });

    } catch (error) {
        console.error("Checkout Error:", error); 
        res.status(500).json({
            message: "Failed to process checkout",
            error: error.message
        });
    }
});

// --- REFUND & RESTOCK LOGIC ---
router.post('/refund', protect, async (req, res) => {
  try {
    const { orderItems } = req.body;
    
    // Loop through the returned items and add +1 back to the stock in the database
    for (let item of orderItems) {
      // Depending on your schema, the ID might be in item.productId or item._id
      const idToRestock = item.productId || item._id; 
      
      // Find the product and increment ($inc) the stock by 1
      await Product.findByIdAndUpdate(idToRestock, { $inc: { stock: 1 } });
    }

    console.log("🛑 Refund successful! Stock restored.");
    res.status(200).json({ message: 'Refund successful! Stock has been restored.' });
  } catch (error) {
    console.error("Refund Error:", error);
    res.status(500).json({ message: 'Failed to process refund: ' + error.message });
  }
});
// --- UPDATE PRODUCT STOCK (RESTOCK) ---
router.put('/:id', protect, async (req, res) => {
  try {
    const { stock } = req.body;
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      { stock: stock }, 
      { new: true } 
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (err) {
    console.error("Error updating product stock:", err);
    res.status(500).json({ message: "Server error while updating stock" });
  }
});
// --- DELETE PRODUCT LOGIC ---
router.delete('/:id', protect, async (req, res) => {
  try {
    // Find the product by its ID and delete it from MongoDB
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully!" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Server error while deleting product" });
  }
});
module.exports = router;