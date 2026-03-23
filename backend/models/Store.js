const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  storeName: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String, 
    required: true 
  },
  managerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);