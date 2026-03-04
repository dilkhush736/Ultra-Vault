const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ email, subject, message }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Ultra Vault" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: message,
    });

    console.log("Email sent:", info.messageId);
  } catch (err) {
    console.error("Email error:", err);
    throw err;
  }
};

module.exports = sendEmail;