const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    time: { type: Date, required: true },
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    metadata: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, default: 'initiated' },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Call', callSchema);
