











// const nodemailer = require('nodemailer');

// // Use JSON transport to avoid SMTP/network issues
// const transporter = nodemailer.createTransport({
//   jsonTransport: true, // emails are output as JSON, no SMTP needed
// });

// // Send verification email
// async function sendVerificationEmail(toEmail, token) {
//   const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${token}`;

//   const info = await transporter.sendMail({
//     from: '"ShopHub" <no-reply@shophub.com>',
//     to: toEmail,
//     subject: 'Verify Your Email - ShopHub',
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
//         <h2 style="color: #6b46c1;">Welcome to ShopHub!</h2>
//         <p>Please verify your email by clicking the button below:</p>
//         <a href="${url}" style="display: inline-block; background: #6b46c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
//           Verify Email
//         </a>
//         <p style="color: #666; font-size: 12px;">If the button doesn't work, copy this link: <br><code>${url}</code></p>
//       </div>
//     `,
//   });

//   console.log('Verification Email JSON output:', info.message);
// }

// // Send password reset email
// async function sendPasswordResetEmail(toEmail, resetUrl) {
//   const info = await transporter.sendMail({
//     from: '"ShopHub" <no-reply@shophub.com>',
//     to: toEmail,
//     subject: 'Reset Your Password - ShopHub',
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
//         <h2 style="color: #6b46c1;">Password Reset Request</h2>
//         <p>We received a request to reset your password. If you did not make this request, you can safely ignore this email.</p>
//         <p>Click the button below to reset your password (link valid for 10 minutes):</p>
//         <a href="${resetUrl}" style="display: inline-block; background: #6b46c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
//           Reset Password
//         </a>
//         <p style="color: #666; font-size: 12px;">If the button doesn't work, copy this link: <br><code>${resetUrl}</code></p>
//       </div>
//     `,
//   });

//   console.log('Password Reset Email JSON output:', info.message);
// }

// module.exports = { sendVerificationEmail, sendPasswordResetEmail };



















const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Verification email
async function sendVerificationEmail(toEmail, token) {
  const url = `${process.env.FRONTEND_URL}/verify?token=${token}`;

  await resend.emails.send({
    from: "ShopHub <onboarding@resend.dev>",
    to: toEmail,
    subject: "Verify Your Email - ShopHub",
    html: `
      <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color:#6b46c1;">Welcome to ShopHub!</h2>
        <p>Please verify your email:</p>
        <a href="${url}" style="background:#6b46c1; color:white; padding:10px 20px; border-radius:6px;">
          Verify Email
        </a>
        <p>If the button doesn't work, use this URL:<br>${url}</p>
      </div>
    `
  });
}

// Password reset
async function sendPasswordResetEmail(toEmail, resetURL) {
  await resend.emails.send({
    from: "ShopHub <onboarding@resend.dev>",
    to: toEmail,
    subject: "Reset Your Password - ShopHub",
    html: `
      <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color:#6b46c1;">Reset Your Password</h2>
        <p>Click below to continue:</p>
        <a href="${resetURL}" style="background:#6b46c1; color:white; padding:10px 20px; border-radius:6px;">
          Reset Password
        </a>
        <p>If the button doesn't work, use this URL:<br>${resetURL}</p>
      </div>
    `
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
