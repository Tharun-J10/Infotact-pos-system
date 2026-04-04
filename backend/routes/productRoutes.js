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
        console.error("GET Products Error:", error); // 🚨 Now it will print in terminal!
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
        console.error("POST Product Error:", error); // 🚨 Now it will print in terminal!
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
        console.error("Checkout Error:", error); // 🚨 Now it will print in terminal!
        res.status(500).json({
            message: "Failed to process checkout",
            error: error.message
        });
    }
});

module.exports = router;