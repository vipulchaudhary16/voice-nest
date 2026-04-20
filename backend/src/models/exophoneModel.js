const mongoose = require('mongoose');

const exophoneSchema = new mongoose.Schema({
  phone_no: { type: String, required: true },
  name: { type: String, required: true },
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Exophone', exophoneSchema);
