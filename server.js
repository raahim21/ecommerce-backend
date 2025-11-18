// server.js
require('dotenv').config();
const express = require('express');
const Stripe = require('stripe')
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const auth = require('./middleware/auth');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    "https://ecommercetikvah.netlify.app"
  ], // your frontend URL
  credentials: true, // important for sending cookies
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/order'));


const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.post("/create-payment-intent", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.productId");
    if (!user || user.cart.length === 0) return res.status(400).json({ message: "Cart is empty" });

    // Calculate total in cents
    const amount = user.cart.reduce((sum, cartItem) => {
      const variant = cartItem.productId.variants.id(cartItem.variantId);
      return sum + variant.price * cartItem.quantity * 100; // multiply by 100 for cents
    }, 0);

    if (amount < 50) {
      return res.status(400).json({ message: "Amount must be at least $0.50" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: "usd",
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});



// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 5000;
// const PORT =  5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));