const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    stock: { type: Number, default: 0 },
    barcode: { type: String, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);