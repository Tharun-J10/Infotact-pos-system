const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // Pulling in Jhanvi's model!

// GET: Fetch all inventory items
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch products", error });
    }
});

// POST: Add a new product to the database
router.post('/', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(500).json({ message: "Failed to add product", error });
    }
});

module.exports = router;