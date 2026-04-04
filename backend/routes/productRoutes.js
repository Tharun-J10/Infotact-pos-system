const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/authMiddleware');
const redisClient = require('../config/redisClient');

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 */

// 🔒 FINAL: Added protect back
router.get('/', protect, async (req, res) => {
    try {
        const cachedData = await redisClient.get('all_products');

        if (cachedData) {
            console.log("⚡ Serving from Redis");
            return res.json(JSON.parse(cachedData));
        }

        console.log("❌ Cache miss");

        const products = await Product.find();

        await redisClient.setEx(
            'all_products',
            3600,
            JSON.stringify(products)
        );

        console.log("📦 Serving from DB");

        res.json(products);

    } catch (error) {
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

        await redisClient.del('all_products');

        res.status(201).json(savedProduct);

    } catch (error) {
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

        await redisClient.del('all_products');

        res.status(200).json({
            message: "Transaction Complete! Stock updated."
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to process checkout",
            error: error.message
        });
    }
});

module.exports = router;