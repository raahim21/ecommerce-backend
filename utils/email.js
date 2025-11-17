// // // utils/email.js
// // const nodemailer = require('nodemailer');

// // const transporter = nodemailer.createTransport({
// //   service: 'gmail',
// //   auth: {
// //     user: process.env.EMAIL_USER,
// //     pass: process.env.EMAIL_PASS,
// //   },
// // });

// // const sendVerificationEmail = async (email, token) => {
// //   const url = `${process.env.FRONTEND_URL}/verify?token=${token}`;
// //   await transporter.sendMail({
// //     from: `"ShopHub" <${process.env.EMAIL_USER}>`,
// //     to: email,
// //     subject: 'Verify Your Email - ShopHub',
// //     html: `
// //       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
// //         <h2 style="color: #6b46c1;">Welcome to ShopHub!</h2>
// //         <p>Please verify your email by clicking the button below:</p>
// //         <a href="${url}" style="display: inline-block; background: #6b46c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
// //           Verify Email
// //         </a>
// //         <p style="color: #666; font-size: 12px;">If the button doesn't work, copy this link: <br><code>${url}</code></p>
// //       </div>
// //     `,
// //   });
// // };

// // module.exports = { sendVerificationEmail };





// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const sendVerificationEmail = async (email, token) => {
//   const url = `${process.env.FRONTEND_URL}/verify?token=${token}`;
//   try {
//     await transporter.sendMail({
//     from: `"ShopHub" <${process.env.EMAIL_USER}>`,
//     to: email,
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
//   } catch (error) {
//     console.log(error)
//     throw error
//   }
// };

// const sendPasswordResetEmail = async (email, resetUrl) => {
//     await transporter.sendMail({
//       from: `"ShopHub" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: 'Reset Your Password - ShopHub',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
//           <h2 style="color: #6b46c1;">Password Reset Request</h2>
//           <p>We received a request to reset your password. If you did not make this request, you can safely ignore this email.</p>
//           <p>Click the button below to reset your password (the link is valid for 10 minutes):</p>
//           <a href="${resetUrl}" style="display: inline-block; background: #6b46c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
//             Reset Password
//           </a>
//           <p style="color: #666; font-size: 12px;">If the button doesn't work, copy this link: <br><code>${resetUrl}</code></p>
//         </div>
//       `,
//     });
// };

// module.exports = { sendVerificationEmail, sendPasswordResetEmail };











const nodemailer = require('nodemailer');

let testAccount, transporter;

// Initialize Ethereal transporter once
async function initEmail() {
  if (!transporter) {
    testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log("Ethereal Email initialized");
  }
}

// Send verification email
async function sendVerificationEmail(toEmail, token) {
  await initEmail();

  const url = `${process.env.FRONTEND_URL}/verify?token=${token}`;

  const info = await transporter.sendMail({
    from: '"ShopHub" <no-reply@shophub.com>',
    to: toEmail,
    subject: 'Verify Your Email - ShopHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #6b46c1;">Welcome to ShopHub!</h2>
        <p>Please verify your email by clicking the button below:</p>
        <a href="${url}" style="display: inline-block; background: #6b46c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #666; font-size: 12px;">If the button doesn't work, copy this link: <br><code>${url}</code></p>
      </div>
    `,
  });

  console.log("Verification Email Preview URL:", nodemailer.getTestMessageUrl(info));
}

// Send password reset email
async function sendPasswordResetEmail(toEmail, resetToken) {
  await initEmail();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const info = await transporter.sendMail({
    from: '"ShopHub" <no-reply@shophub.com>',
    to: toEmail,
    subject: 'Reset Your Password - ShopHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #6b46c1;">Password Reset Request</h2>
        <p>We received a request to reset your password. If you did not make this request, you can safely ignore this email.</p>
        <p>Click the button below to reset your password (link valid for 10 minutes):</p>
        <a href="${resetUrl}" style="display: inline-block; background: #6b46c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 12px;">If the button doesn't work, copy this link: <br><code>${resetUrl}</code></p>
      </div>
    `,
  });

  console.log("Password Reset Email Preview URL:", nodemailer.getTestMessageUrl(info));
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
