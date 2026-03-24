const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 🚨 THE FIX: Importing all three required models!
const Sale = require('../models/Sale'); 
const Product = require('../models/Product');
const InventoryLedger = require('../models/InventoryLedger');
const { protect, authorize } = require('../middleware/authMiddleware');

// POST: Process an Atomic POS Checkout (Secure Pricing Version)
router.post('/', protect, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { items, storeId, paymentMethod } = req.body;
        
        let processedItems = []; 
        let calculatedTotal = 0; 

        // 1. Process Inventory & Lookup Real Prices
        for (let item of items) {
            const product = await Product.findById(item.productId).session(session);
            
            if (!product || product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product ID: ${item.productId}`);
            }

            product.stock -= item.quantity;
            await product.save({ session });

            processedItems.push({
                productId: product._id,
                productName: product.name,
                price: product.price,
                quantity: item.quantity
            });

            calculatedTotal += (product.price * item.quantity);

            const ledgerEntry = new InventoryLedger({
                productId: item.productId,
                storeId: storeId,
                quantityChanged: -item.quantity,
                transactionType: 'SALE'
            });
            await ledgerEntry.save({ session });
        }

        // 2. Create the Sale Record with our secure data
        const newSale = new Sale({
            items: processedItems,
            storeId,
            totalAmount: calculatedTotal,
            paymentMethod,
            cashierId: req.user._id 
        });
        
        const savedSale = await newSale.save({ session });

        // 3. Commit the changes permanently!
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: "Checkout complete", sale: savedSale });

    } catch (error) {
        // ABORT! Undo everything!
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: "Checkout failed, transaction rolled back", error: error.message });
    }
});

// GET: View all past sales
router.get('/', protect, authorize('Manager', 'System Administrator'), async (req, res) => {
    try {
        const sales = await Sale.find().populate('cashierId', 'name email');
        res.status(200).json(sales);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch sales history", error });
    }
});

module.exports = router;