// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Cashier', 'Manager', 'System Administrator'], 
    default: 'Cashier' 
  }
}, { timestamps: true });

// 🚨 THE MODERN FIX: We removed 'next' entirely!
userSchema.pre('save', async function () {
  // If password wasn't changed, just return and let Mongoose auto-save
  if (!this.isModified('password')) {
    return; 
  }
  
  // Otherwise, hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);