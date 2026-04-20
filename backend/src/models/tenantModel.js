const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  /** Exotel flow / IVR `tenant_id` query param (e.g. 424020) — used to map webhooks to this tenant */
  exotel_tenant_id: { type: String, sparse: true, unique: true, trim: true },
  ivr_data: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tenant', tenantSchema);
