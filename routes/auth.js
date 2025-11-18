// const express = require('express');
// const { register, login, verifyEmail, getMe, logout, forgotPassword, resetPassword, changeMe, checkPassword, changePassword } = require('../controllers/authController');
// const auth = require('../middleware/auth');
// const User = require('../models/User');

// const router = express.Router();

// router.get('/hey', async (req, res)=>{
//     await User.deleteMany({})
//     res.json('nice')
// });

// router.post('/register', register);
// router.post('/login', login);
// router.get('/verify/:token', verifyEmail);
// router.get('/me', auth, getMe);
// router.patch('/change-name', auth, changeMe);
// router.post('/verify-password', auth, checkPassword);
// router.patch('/change-password', auth, changePassword);
// router.post('/logout', logout);
// router.post('/forgot-password', forgotPassword);
// router.patch('/reset-password/:token', resetPassword);

// module.exports = router;




const express = require('express');
const {
  register,
  login,
  getMe,
  logout,
  changeMe,
  checkPassword,
  changePassword,
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Optional: Clear all users (dev only!)
router.get('/hey', async (req, res) => {
  await User.deleteMany({});
  res.json('All users deleted - nice!');
});

// Core Auth Routes (No Email Verification or Password Reset)
router.post('/register', register);                    // Creates user & logs in immediately
router.post('/login', login);                          // Login with email + password
router.post('/logout', logout);                        // Clear cookie
router.get('/me', auth, getMe);                        // Get current user
router.patch('/change-name', auth, changeMe);          // Update name
router.post('/verify-password', auth, checkPassword);  // Check if current password is correct
router.patch('/change-password', auth, changePassword);// Change password (requires current)

// REMOVED ROUTES:
// router.get('/verify/:token', verifyEmail);           // Removed: Email verification
// router.post('/forgot-password', forgotPassword);     // Removed: Forgot password
// router.patch('/reset-password/:token', resetPassword); // Removed: Reset via token

module.exports = router;