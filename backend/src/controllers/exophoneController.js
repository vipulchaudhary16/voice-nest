const Exophone = require('../models/exophoneModel');

exports.getExophones = async (req, res, next) => {
  try {
    const exophones = await Exophone.find({ tenant_id: req.user.tenant_id });
    res.status(200).json({ success: true, data: exophones });
  } catch (error) {
    next(error);
  }
};

exports.createExophone = async (req, res, next) => {
  try {
    const { phone_no, name } = req.body;
    const exophone = await Exophone.create({
      phone_no,
      name,
      tenant_id: req.user.tenant_id,
    });
    res.status(201).json({ success: true, data: exophone });
  } catch (error) {
    next(error);
  }
};

exports.deleteExophone = async (req, res, next) => {
  try {
    const exophone = await Exophone.findOneAndDelete({
      _id: req.params.id,
      tenant_id: req.user.tenant_id,
    });
    if (!exophone) return res.status(404).json({ success: false, message: 'Exophone not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
