const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 0 },
  barcode: { type: String, unique: true },
  // ✨ The image URL is now safely inside the ONLY schema
  imageUrl: { type: String, default: "" } 
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);