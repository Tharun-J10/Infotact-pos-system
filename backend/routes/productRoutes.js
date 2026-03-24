// backend/routes/productRoutes.js
const { protect, authorize } = require('../middleware/authMiddleware'); // Import at the top!
const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); 

// The middleware is injected into the route path
router.post('/', protect, authorize('Manager', 'System Administrator'), async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(500).json({ message: "Failed to add product", error });
    }
});

module.exports = router;