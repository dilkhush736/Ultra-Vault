const { Resend } = require("resend");

// 🔐 Ensure API key exists BEFORE creating instance
if (!process.env.RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY is missing in .env");
  throw new Error("RESEND_API_KEY is missing in environment variables");
}

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * sendEmail({ email, subject, message })
 * message = HTML string
 */
const sendEmail = async ({ email, subject, message }) => {
  try {
    const FROM_EMAIL =
      process.env.RESEND_FROM || "onboarding@resend.dev";

    const response = await resend.emails.send({
      from: `Ultra Vault <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: message,
    });

    if (response.error) {
      console.error("Resend Error:", response.error);
      throw new Error(response.error.message || "Email failed");
    }

    console.log("✅ Email sent successfully");
    return response;
  } catch (err) {
    console.error("❌ sendEmail Error:", err.message);
    throw err;
  }
};

module.exports = sendEmail;