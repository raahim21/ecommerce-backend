// const User = require('../models/User');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
// const crypto = require('crypto');
// const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

// const signToken = (user) =>
//   jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
//     expiresIn: '7d',
//   });

// const setAuthCookie = (res, token) => {
//   res.cookie('token', token, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production', // Only secure in production
//     sameSite: 'lax', // or 'none' if frontend is on different domain + secure: true
//     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//   });
// };

// // ==================== REGISTER ====================
// exports.register = async (req, res) => {
//   const { name, email, password } = req.body;

//   try {
//     if (!name || !email || !password) {
//       return res.status(400).json({ msg: 'All fields are required' });
//     }

//     const existing = await User.findOne({ email });
//     if (existing) {
//       return res.status(400).json({ msg: 'Email already in use' });
//     }

//     // Generate verification token
//     const verificationToken = crypto.randomBytes(32).toString('hex');
//     const verificationTokenExpires = Date.now() +  15 * 60 * 1000; // 24 hours

//     const user = await User.create({
//       name,
//       email,
//       password,
//       verificationToken,
//       verificationTokenExpires,
//     });

//     // Send verification email
//     const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
//     await sendVerificationEmail(email, verificationToken); // or pass full URL if you prefer

//     res.status(201).json({
//       msg: 'Registration successful! Please check your email to verify your account.',
//     });
//   } catch (err) {
//     console.error('Register error:', err);
//     res.status(500).json({ msg: 'Server error' });
//   }
// };

// // ==================== LOGIN ====================
// exports.login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Optional cleanup (can be moved to cron job later)
//     await User.deleteMany({
//       isVerified: false,
//       verificationTokenExpires: { $lt: Date.now() },
//     });

//     const user = await User.findOne({ email }).select('+password');
//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(400).json({ msg: 'Invalid email or password' });
//     }

//     if (!user.isVerified) {
//       return res.status(400).json({ msg: 'Please verify your email first' });
//     }

//     const token = signToken(user);
//     setAuthCookie(res, token);

//     res.json({
//       msg: 'Logged in successfully',
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ msg: 'Server error' });
//   }
// };

// // ==================== VERIFY EMAIL ====================
// exports.verifyEmail = async (req, res) => {
//   const { token } = req.params;

//   try {
//     const user = await User.findOne({
//       verificationToken: token,
//       verificationTokenExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ msg: 'Invalid or expired verification token' });
//     }

//     user.isVerified = true;
//     user.verificationToken = undefined;
//     user.verificationTokenExpires = undefined;
//     await user.save();

//     res.json({ msg: 'Email verified successfully! You can now log in.' });
//   } catch (err) {
//     console.error('Verify email error:', err);
//     res.status(500).json({ msg: 'Server error' });
//   }
// };

// // ==================== CHANGE PASSWORD (Authenticated) ====================
// exports.changePassword = async (req, res) => {
//   const { currentPassword, newPassword } = req.body;

//   try {
//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ msg: 'Both current and new password are required' });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({ msg: 'New password must be at least 6 characters' });
//     }

//     const user = await User.findById(req.user.id).select('+password');
//     if (!user) return res.status(404).json({ msg: 'User not found' });

//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) {
//       return res.status(400).json({ msg: 'Current password is incorrect' });
//     }

//     user.password = newPassword;
//     await user.save();

//     res.json({ msg: 'Password changed successfully!' });
//   } catch (err) {
//     console.error('Change password error:', err);
//     res.status(500).json({ msg: 'Server error' });
//   }
// };

// // ==================== CHECK CURRENT PASSWORD (for security) ====================
// exports.checkPassword = async (req, res) => {
//   const { password } = req.body;

//   try {
//     const user = await User.findById(req.user.id).select('+password');
//     const isCorrect = await user.comparePassword(password);

//     res.json({ confirmed: isCorrect });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: 'Server error' });
//   }
// };

// // ==================== GET ME ====================
// exports.getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-password');
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ msg: 'Server error' });
//   }
// };

// // ==================== UPDATE PROFILE NAME ====================
// exports.changeMe = async (req, res) => {
//   const { name } = req.body;

//   try {
//     if (!name || name.trim() === '') {
//       return res.status(400).json({ msg: 'Name is required' });
//     }

//     const user = await User.findByIdAndUpdate(
//       req.user.id,
//       { name: name.trim() },
//       { new: true, runValidators: true }
//     ).select('name email');

//     res.json(user);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: 'Server error' });
//   }
// };

// // ==================== LOGOUT ====================
// exports.logout = (req, res) => {
//   res.clearCookie('token', {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'lax',
//   });
//   res.json({ msg: 'Logged out successfully' });
// };

// // ==================== FORGOT PASSWORD ====================
// exports.forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       // Security: don't reveal if email exists
//       return res.json({ msg: 'If your email is registered, you will receive a reset link.' });
//     }

//     const resetToken = user.createPasswordResetToken();
//     await user.save({ validateBeforeSave: false });

//     const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

//     try {
//       await sendPasswordResetEmail(user.email, resetURL);
//       res.json({ msg: 'Password reset link sent to your email.' });
//     } catch (emailErr) {
//       user.passwordResetToken = undefined;
//       user.passwordResetExpires = undefined;
//       await user.save({ validateBeforeSave: false });

//       console.error('Email sending failed:', emailErr);
//       res.status(500).json({ msg: 'Error sending email. Try again later.' });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: 'Server error' });
//   }
// };

// // ==================== RESET PASSWORD ====================
// exports.resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;

//     if (!password || password.length < 6) {
//       return res.status(400).json({ msg: 'Password must be at least 6 characters' });
//     }

//     const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

//     const user = await User.findOne({
//       passwordResetToken: hashedToken,
//       passwordResetExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ msg: 'Token is invalid or has expired' });
//     }

//     user.password = password;
//     user.passwordResetToken = undefined;
//     user.passwordResetExpires = undefined;
//     await user.save();

//     const jwtToken = signToken(user);
//     setAuthCookie(res, jwtToken);

//     res.json({ msg: 'Password reset successful! You are now logged in.' });
//   } catch (err) {
//     console.error('Reset password error:', err);
//     res.status(500).json({ msg: 'Server error' });
//   }
// };





// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ==================== REGISTER ====================
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email already in use' });
    }

    const user = await User.create({ name, email, password });

    const token = signToken(user);
    setAuthCookie(res, token);

    res.status(201).json({
      msg: 'Registration successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    res.json({
      msg: 'Logged in successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ==================== CHANGE PASSWORD (Authenticated) ====================
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ msg: 'Valid current and new password (min 6 chars) required' });
    }

    const user = await User.findById(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ==================== CHECK CURRENT PASSWORD ====================
exports.checkPassword = async (req, res) => {
  const { password } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const isCorrect = await user.comparePassword(password);
    res.json({ confirmed: isCorrect });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// ==================== GET CURRENT USER ====================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// ==================== UPDATE NAME ====================
exports.changeMe = async (req, res) => {
  const { name } = req.body;
  try {
    if (!name?.trim()) {
      return res.status(400).json({ msg: 'Name is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    ).select('name email');

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ==================== LOGOUT ====================
exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ msg: 'Logged out successfully' });
};