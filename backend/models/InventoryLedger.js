const mongoose = require('mongoose');

const inventoryLedgerSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  storeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Store', 
    required: true 
  },
  quantityChanged: { 
    type: Number, 
    required: true 
  },
  transactionType: { 
    type: String, 
    enum: ['SALE', 'RESTOCK', 'TRANSFER'], 
    required: true 
  }
}, { timestamps: true });

// This bottom line is what was likely missing or misspelled!
module.exports = mongoose.model('InventoryLedger', inventoryLedgerSchema);