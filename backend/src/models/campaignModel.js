const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    lists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'List' }],
    caller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exophone', required: true },
    campaign_type: { type: String, enum: ['static', 'dynamic'], default: 'static' },
    flow_type: { type: String, enum: ['ivr', 'greeting'] },
    read_via_text: { type: String },
    url: { type: String },
    retries: {
      number_of_retries: { type: Number, default: 0 },
      interval_mins: { type: Number },
      mechanism: { type: String, enum: ['Linear', 'Exponential'], default: 'Linear' },
      on_status: [{ type: String }],
    },
    schedule: {
      send_at: { type: Date },
      end_at: { type: Date },
    },
    /** Comma-separated E.164 numbers when audience uses CSV / direct dial (Exotel `from`). */
    from_numbers: { type: String },
    type: { type: String, enum: ['trans', 'promo'], default: 'trans' },
    call_duplicate_numbers: { type: Boolean, default: false },
    status_callback: { type: String },
    call_status_callback: { type: String },
    call_schedule_callback: { type: String },
    mode: { type: String, enum: ['auto', 'custom'], default: 'auto' },
    throttle: { type: Number },
    custom_field: { type: String },
    repeat_menu_attempts: { type: Number, default: 0 },
    exotel_sid: { type: String },
    status: { type: String, default: 'Created' },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Campaign', campaignSchema);
