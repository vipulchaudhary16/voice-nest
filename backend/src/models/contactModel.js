const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    phone_no: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String },
    email: { type: String },
    tag: { type: String },
    exotel_sid: { type: String },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Contact', contactSchema);
