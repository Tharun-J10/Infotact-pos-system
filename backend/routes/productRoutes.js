const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all products
 */
router.get('/', protect, async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch products", error });
    }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Add a new product
 *     tags: [Products]
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/', protect, authorize('Manager', 'System Administrator'), async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(500).json({ message: "Failed to add product", error });
    }
});

/**
 * @swagger
 * /api/products/checkout:
 *   post:
 *     summary: Checkout and update stock
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Transaction completed
 */
router.post('/checkout', protect, async (req, res) => {
    try {
        const { orderItems } = req.body;

        for (let item of orderItems) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -1 }
            });
        }

        res.status(200).json({ message: "Transaction Complete! Stock updated." });
    } catch (error) {
        res.status(500).json({ message: "Failed to process checkout", error: error.message });
    }
});

module.exports = router;