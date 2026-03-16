const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale'); // Pulling in the blueprint you just made!

// POST: Process a new checkout/sale
router.post('/', async (req, res) => {
    try {
        const newSale = new Sale(req.body);
        const savedSale = await newSale.save();
        res.status(201).json(savedSale);
    } catch (error) {
        res.status(500).json({ message: "Failed to process sale", error });
    }
});

// GET: View all past sales (Transaction History)
router.get('/', async (req, res) => {
    try {
        const sales = await Sale.find();
        res.status(200).json(sales);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch sales history", error });
    }
});

module.exports = router;