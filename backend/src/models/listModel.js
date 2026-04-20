const mongoose = require('mongoose');

const listSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tag: { type: String },
    exotel_sid: { type: String },
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('List', listSchema);
