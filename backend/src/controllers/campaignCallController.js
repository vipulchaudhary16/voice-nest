const Tenant = require('../models/tenantModel');
const exotelCallService = require('../services/exotelCallService');

exports.getCallDetails = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.user.tenant_id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const details = await exotelCallService.getCallDetails(tenant, req.params.callSid);
    return res.status(200).json({ success: true, data: details });
  } catch (error) {
    return next(error);
  }
};
