const express = require('express');
const { register, login, verifyEmail, getMe, logout, forgotPassword, resetPassword, changeMe, checkPassword, changePassword } = require('../controllers/authController');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get('/hey', async (req, res)=>{
    await User.deleteMany({})
    res.json('nice')
});

router.post('/register', register);
router.post('/login', login);
router.get('/verify/:token', verifyEmail);
router.get('/me', auth, getMe);
router.patch('/change-name', auth, changeMe);
router.post('/verify-password', auth, checkPassword);
router.patch('/change-password', auth, changePassword);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

module.exports = router;
