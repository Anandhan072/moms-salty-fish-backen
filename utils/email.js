const axios = require("axios");


const AppError = require('./appError')
let zohoAccessToken = null; // Cached access token
let tokenGeneratedAt = null; // Token timestamp
const TOKEN_VALIDITY_MS = 59 * 60 * 1000; // 59 minutes

/**
 * Sends an email using Zoho Mail API.
 * Automatically handles token refresh and caching.
 *
 * @param {Object} option - Email details
 * @param {string} option.toAddress - Recipient email address
 * @param {string} option.subject - Email subject line
 * @param {string} option.message - Email body text
 */
exports.zohoMail = async (option) => {
  try {
    // Step 1️⃣ — Use cached token if valid
    if (zohoAccessToken && Date.now() - tokenGeneratedAt < TOKEN_VALIDITY_MS) {
      console.log("✅ Using cached Zoho token");
    } else {
      console.log("♻️ Fetching new Zoho token...");

      const res = await axios.post(
        "https://accounts.zoho.in/oauth/v2/token",
        new URLSearchParams({
          refresh_token: process.env.ZOHO_MAIL_REFRESH_TOKEN_OTP,
          grant_type: "refresh_token",
          client_id: process.env.ZOHO_CLIENT_ID_OTP,
          client_secret: process.env.ZOHO_CLIENT_SECRET_OTP,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      zohoAccessToken = res.data.access_token;
      tokenGeneratedAt = Date.now();

      console.log("✅ New Zoho token generated");
    }

    // Step 2️⃣ — Send email using Zoho Mail API
    console.log("📨 Sending email via Zoho API...");

    const payload = {
      fromAddress: process.env.ZOHO_MAIL_ID_OTP,
      toAddress: option.toAddress,
      subject: option.subject || "Mom's Salty Fish - Customer Support",
      content: `
Hello ${option.toAddress || "Customer"},
\n
${option.message}
\n
Please do not reply to this email.  
For any assistance, contact us at:
\n
📧 support@momssaltyfish.com  
📞 8870841167
\n
Thanks & Regards,  
Mom's Salty Fish Support Team
      `,
      askReceipt: "no",
    };

    const response = await axios.post(
      `https://mail.zoho.in/api/accounts/${process.env.ZOHO_ACCOUNT_ID_OTP}/messages`,
      payload,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Zoho-oauthtoken ${zohoAccessToken}`,
        },
      }
    );

    console.log("✅ Email sent successfully:", response.data);

    // Step 3️⃣ — Return results
    return {
      status: "success",
      token: zohoAccessToken,
      data: response.data,
    };
  } catch (err) {
    // ✅ CENTRALIZED ERROR MAPPING
    if (err.response) {
      throw new AppError(
        `Zoho API Error: ${err.response.data?.message || "Email failed"}`,
        err.response.status
      );
    }

    if (err.request) {
      throw new AppError("Zoho Mail service unreachable", 503);
    }

    throw new AppError(err.message || "Zoho mail failed", 500);
  }
};

