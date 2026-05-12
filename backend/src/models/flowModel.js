const mongoose = require('mongoose');

const flowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    app_id: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  },
  { timestamps: true }
);

flowSchema.index({ tenant_id: 1, app_id: 1 }, { unique: true });

module.exports = mongoose.model('Flow', flowSchema);
