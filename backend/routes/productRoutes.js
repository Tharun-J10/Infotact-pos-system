// backend/routes/productRoutes.js
const { protect, authorize } = require('../middleware/authMiddleware'); // Import at the top!
const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); 

// Fetch all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({}); // Grabs everything from the database
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch products", error });
    }
});

// The middleware is injected into the route path
router.post('/', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(500).json({ message: "Failed to add product", error });
    }
});
// --- ATOMIC TRANSACTION: CHECKOUT & STOCK REDUCTION ---
router.post('/checkout', async (req, res) => {
    try {
        const { orderItems, totalPrice } = req.body;

        // Loop through every item in the cart
        for (let item of orderItems) {
            // Find the product by its ID and reduce its stock by 1
            // $inc is a powerful MongoDB operator that safely increments/decrements numbers
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -1 } 
            });
        }

        res.status(200).json({ message: "Transaction Complete! Stock updated." });
    } catch (error) {
        console.error("Checkout Engine Error:", error);
        res.status(500).json({ message: "Failed to process checkout", error: error.message });
    }
});
module.exports = router;