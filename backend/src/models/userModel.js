const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['super_admin', 'user'],
    default: 'user'
  },
  tenant_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tenant', 
    required: function() { return this.role === 'user'; } 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
