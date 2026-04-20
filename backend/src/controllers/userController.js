const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res, next) => {
  try {
    // Super admins can get all users or query by tenant_id
    const filter = req.query.tenant_id ? { tenant_id: req.query.tenant_id } : {};
    const users = await User.find(filter).populate('tenant_id', 'name').select('-password');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, tenant_id } = req.body;

    if (role !== 'super_admin' && !tenant_id) {
      return res
        .status(400)
        .json({ success: false, message: 'tenant_id is required for normal users' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      tenant_id,
    });

    res
      .status(201)
      .json({
        success: true,
        data: { _id: user._id, name: user.name, email: user.email, role: user.role },
      });
  } catch (error) {
    next(error);
  }
};
