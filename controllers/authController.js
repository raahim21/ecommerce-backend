


const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

const signToken = (user) => jwt.sign(
  { id: user._id, role: user.role }, 
  process.env.JWT_SECRET, 
  { expiresIn: '7d' }
);

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};


// exports.register = async (req, res) => {
//   const { name, email, password } = req.body;

//   try {
//     if (!name || !email || !password) {
//       return res.status(400).json({ msg: 'All fields are required' });
//     }

//     const existing = await User.findOne({ email });
//     if (existing) return res.status(400).json({ msg: 'Email already in use' });

//     const token = crypto.randomBytes(20).toString('hex');
//     const user = new User({ name, email, password, verificationToken: token });
//     await user.save();

//     await sendVerificationEmail(email, token);

//     res.status(201).json({
//       msg: 'Verification email sent (check console for preview URL)',
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: 'Server error' });
//   }
// };



// const crypto = require('crypto');
// const User = require('../models/User');
// const { sendVerificationEmail } = require('../utils/email');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already in use' });

    const token = crypto.randomBytes(20).toString('hex');
    const user = new User({ name, email, password, verificationToken: token });
    await user.save();

    await sendVerificationEmail(email, token);

    res.status(201).json({
      msg: 'Verification email sent (check console for JSON output)',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    if (!user.isVerified) {
      return res.status(400).json({ msg: 'Please verify your email first' });
    }

    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ msg: 'Logged in successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ msg: 'Invalid or expired token' });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ msg: 'Email verified! You can now log in.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    let { newPassword } = req.body
    if(!newPassword || newPassword.length <= 3){
      return res.json(404).json({ msg: 'no password entered or length is less than 3' })
    }

    let user = await User.findOne({_id:req.user.id})
    user.password = newPassword
    
    user.save()
    if(!user) return res.json(404).json({ msg: 'no user found' })

    return res.status(200).json({msg:'password changed successfully!'})
  } catch (error) {
    console.log(error)
    return res.status(500).json({ msg: 'Server error' });
  }
}

exports.checkPassword = async (req, res) => {
  try {
    let { password } = req.body
    let user = await User.findOne({_id:req.user.id}).select('password')
    let confirmed = await bcrypt.compare(password, user.password)
    console.log(confirmed, password)
    return res.status(200).json({confirmed})

  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Server error' });
  }
}

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};


exports.changeMe = async (req, res) => {
  try {
    let { name } = req.body
    if(!name) return
    const user = await User.findByIdAndUpdate(req.user.id, {name:name}).select('name');
    res.json(user.name);
  } catch (err) {
    console.log(err)
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ msg: 'Logged out successfully' });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ msg: 'If a user with that email exists, a password reset link has been sent.' });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(user.email, resetURL);

    res.json({ msg: 'Password reset link sent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'There was an error sending the email. Please try again later.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Token is invalid or has expired.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const jwtToken = signToken(user);
    setAuthCookie(res, jwtToken);

    res.json({ msg: 'Password reset successful.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error.' });
  }
};
