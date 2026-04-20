const Tenant = require('../models/tenantModel');

exports.getTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.find().sort('-createdAt');
    res.status(200).json({ success: true, count: tenants.length, data: tenants });
  } catch (error) {
    next(error);
  }
};

exports.createTenant = async (req, res, next) => {
  try {
    const { name, city, ivr_data, exotel_tenant_id } = req.body;

    const existingTenant = await Tenant.findOne({ name });
    if (existingTenant) {
      return res
        .status(400)
        .json({ success: false, message: 'Tenant with this name already exists' });
    }

    const tenant = await Tenant.create({
      name,
      city,
      ivr_data,
      ...(exotel_tenant_id != null && exotel_tenant_id !== ''
        ? { exotel_tenant_id: String(exotel_tenant_id).trim() }
        : {}),
    });

    res.status(201).json({ success: true, data: tenant });
  } catch (error) {
    next(error);
  }
};

exports.updateTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.status(200).json({ success: true, data: tenant });
  } catch (error) {
    next(error);
  }
};
