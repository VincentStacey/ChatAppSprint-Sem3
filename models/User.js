const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  joinDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
