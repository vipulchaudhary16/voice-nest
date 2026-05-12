const User = require('../models/userModel');
const Tenant = require('../models/tenantModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

exports.register = async (req, res, next) => {
  return res
    .status(403)
    .json({
      success: false,
      message: 'Public registration is disabled. Please contact your system administrator.',
    });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const tenant = user.tenant_id ? await Tenant.findById(user.tenant_id).lean() : null;

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        tenant_name: tenant?.name || null,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};
