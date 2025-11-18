// // emailService.js
// const nodemailer = require("nodemailer");

// // Gmail SMTP transporter (using environment variables for security)
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false, // TLS
//   auth: {
//     user: "raahimwajid21@gmail.com",     // e.g. raahimwajid21@gmail.com
//     pass: 'knhskvcffkfryjgb',     // Your 16-digit App Password
//   },
//   requireTLS: true,
//   // connectionTimeout: 10000,
//   // greetingTimeout: 10000,
//   // socketTimeout: 10000,
// });

// // Optional: Verify connection on startup
// transporter.verify((error, success) => {
//   if (error) {
//     console.error("SMTP connection error:", error);
//   } else {
//     console.log("SMTP server is ready to send emails");
//   }
// });

// // ======================
// // Send Verification Email
// // ======================
// async function sendVerificationEmail(toEmail, token) {
//   const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${token}`;

//   const html = `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
//       <h2 style="color: #6b46c1;">Welcome to ShopHub!</h2>
//       <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
//       <p style="text-align: center; margin: 30px 0;">
//         <a href="${verificationUrl}" style="background:#6b46c1; color:white; padding:12px 28px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:16px;">
//           Verify Email Address
//         </a>
//       </p>
//       <p>If the button doesn't work, copy and paste this link into your browser:<br/>
//         <a href="${verificationUrl}">${verificationUrl}</a>
//       </p>
//       <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
//       <p style="color: #888; font-size: 12px;">This link will expire in 24 hours.</p>
//     </div>
//   `;

//   const info = await transporter.sendMail({
//     from: `"ShopHub" <${process.env.EMAIL_USER}>`,
//     to: toEmail,
//     subject: "Verify Your Email - ShopHub",
//     text: `Verify your email by visiting this link: ${verificationUrl}`,
//     html,
//   });

//   console.log("Verification email sent →", info.messageId);
// }

// // ======================
// // Send Password Reset Email
// // ======================
// async function sendPasswordResetEmail(toEmail, resetToken) {
//   const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

//   const html = `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
//       <h2 style="color: #6b46c1;">Password Reset Request</h2>
//       <p>You requested to reset your password. Click the button below to set a new password:</p>
//       <p style="text-align: center; margin: 30px 0;">
//         <a href="${resetUrl}" style="background:#6b46c1; color:white; padding:12px 28px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:16px;">
//           Reset Password
//         </a>
//       </p>
//       <p>If the button doesn't work, use this link:<br/>
//         <a href="${resetUrl}">${resetUrl}</a>
//       </p>
//       <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
//       <p style="color: #888; font-size: 12px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
//     </div>
//   `;

//   const info = await transporter.sendMail({
//     from: `"ShopHub" <${process.env.EMAIL_USER}>`,
//     to: toEmail,
//     subject: "Reset Your Password - ShopHub",
//     text: `Reset your password here: ${resetUrl}`,
//     html,
//   });

//   console.log("Password reset email sent →", info.messageId);
// }

// // Export the functions
// module.exports = {
//   sendVerificationEmail,
//   sendPasswordResetEmail,
// };





// utils/emailService.js  (or wherever you keep it)

const { Resend } = require("resend");

// Initialize Resend client (throws if key missing)
const resend = new Resend(process.env.RESEND_API_KEY);

// Optional: Log on startup
console.log("Resend email service ready");

// ======================
// Send Verification Email
// ======================
async function sendVerificationEmail(toEmail, token) {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: "ShopHub <onboarding@resend.dev>", // Must be verified domain or this default
    to: [toEmail],
    subject: "Verify Your Email - ShopHub",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #6b46c1; text-align: center;">Welcome to ShopHub!</h2>
        <p style="font-size: 16px;">Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${verificationUrl}" style="background:#6b46c1; color:white; padding:14px 32px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:17px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 14px; color: #555;">
          If the button doesn't work, copy and paste this link:<br/>
          <a href="${verificationUrl}" style="color:#6b46c1;">${verificationUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #888; font-size: 12px; text-align: center;">
          This link expires in 24 hours. If you didn't create an account, ignore this email.
        </p>
      </div>
    `,
    text: `Verify your email: ${verificationUrl}`,
  });

  if (error) {
    console.error("Resend verification email failed:", error);
    throw new Error("Failed to send verification email");
  }

  console.log("Verification email sent →", data.id);
  return data;
}

// ======================
// Send Password Reset Email
// ======================
async function sendPasswordResetEmail(toEmail, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const { data, error } = await resend.emails.send({
    from: "ShopHub <onboarding@resend.dev>",
    to: [toEmail],
    subject: "Reset Your Password - ShopHub",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #6b46c1; text-align: center;">Password Reset Request</h2>
        <p style="font-size: 16px;">We received a request to reset your ShopHub password. Click below to set a new one:</p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetUrl}" style="background:#6b46c1; color:white; padding:14px 32px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:17px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #555;">
          If the button doesn't work, use this link:<br/>
          <a href="${resetUrl}" style="color:#6b46c1;">${resetUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #888; font-size: 12px; text-align: center;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Reset your password: ${resetUrl}`,
  });

  if (error) {
    console.error("Resend password reset email failed:", error);
    throw new Error("Failed to send password reset email");
  }

  console.log("Password reset email sent →", data.id);
  return data;
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};