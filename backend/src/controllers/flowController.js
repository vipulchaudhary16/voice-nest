const Flow = require('../models/flowModel');

const sanitizeTags = (raw) => {
  if (!raw) return [];
  const arr = Array.isArray(raw)
    ? raw
    : String(raw)
        .split(',')
        .map((t) => t.trim());
  return arr
    .map((t) => String(t).trim())
    .filter((t) => t.length > 0);
};

const buildPayload = (body = {}) => {
  const payload = {};
  if (typeof body.name === 'string') payload.name = body.name.trim();
  if (typeof body.app_id === 'string') payload.app_id = body.app_id.trim();
  if (body.tags !== undefined) payload.tags = sanitizeTags(body.tags);
  return payload;
};

const handleDuplicate = (err, res) => {
  if (err && err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A flow with this app_id already exists',
    });
  }
  return null;
};

exports.getFlows = async (req, res, next) => {
  try {
    const flows = await Flow.find({ tenant_id: req.user.tenant_id }).sort({ name: 1 });
    res.status(200).json({ success: true, data: flows });
  } catch (error) {
    next(error);
  }
};

exports.createFlow = async (req, res, next) => {
  try {
    const payload = buildPayload(req.body);
    if (!payload.name || !payload.app_id) {
      return res.status(400).json({ success: false, message: 'name and app_id are required' });
    }
    const flow = await Flow.create({ ...payload, tenant_id: req.user.tenant_id });
    res.status(201).json({ success: true, data: flow });
  } catch (error) {
    const dup = handleDuplicate(error, res);
    if (dup) return dup;
    next(error);
  }
};

exports.updateFlow = async (req, res, next) => {
  try {
    const payload = buildPayload(req.body);
    const flow = await Flow.findOneAndUpdate(
      { _id: req.params.id, tenant_id: req.user.tenant_id },
      payload,
      { new: true, runValidators: true }
    );
    if (!flow) return res.status(404).json({ success: false, message: 'Flow not found' });
    res.status(200).json({ success: true, data: flow });
  } catch (error) {
    const dup = handleDuplicate(error, res);
    if (dup) return dup;
    next(error);
  }
};

exports.deleteFlow = async (req, res, next) => {
  try {
    const flow = await Flow.findOneAndDelete({
      _id: req.params.id,
      tenant_id: req.user.tenant_id,
    });
    if (!flow) return res.status(404).json({ success: false, message: 'Flow not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
