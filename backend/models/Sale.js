const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
    items: [{
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: "Cash" }
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);