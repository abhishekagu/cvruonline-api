import nodemailer from 'nodemailer';

/**
 * Configure reusable nodemailer transporter
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

/**
 * Send Password Reset OTP Email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient user's name
 * @param {string} options.otp - 6-digit OTP string
 */
export const sendPasswordResetOtpEmail = async ({ to, name, otp }) => {
    const transporter = createTransporter();
    const sender = process.env.SMTP_USER || 'noreply@cvru.ac.in';
    const displayName = 'Dr. C.V. Raman University Online';

    const mailOptions = {
        from: `"${displayName}" <${sender}>`,
        to,
        subject: `Password Reset Verification Code: ${otp}`,
        text: `Hello ${name || 'Student'},\n\nYour One-Time Password (OTP) for resetting your CVRU Online account password is: ${otp}\n\nThis OTP is valid for 10 minutes. Please do not share this OTP with anyone.\n\nIf you did not request a password reset, please ignore this email.\n\nWarm regards,\nDr. C.V. Raman University Online`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f2744 0%, #1a3a60 100%); padding: 28px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.3px;">
                Dr. C.V. Raman University
              </h1>
              <p style="color: #cbd5e1; margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                Centre for Distance and Online Education
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 30px 25px 30px;">
              <h2 style="color: #111827; font-size: 19px; font-weight: 600; margin: 0 0 14px 0;">
                Password Reset Verification
              </h2>
              <p style="color: #4b5563; font-size: 14.5px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello <strong>${name || 'Student'}</strong>,
              </p>
              <p style="color: #4b5563; font-size: 14.5px; line-height: 1.6; margin: 0 0 25px 0;">
                We received a request to reset your password for your CVRU Online Portal account. Please use the following 6-digit One-Time Password (OTP) to complete your verification:
              </p>

              <!-- OTP Box -->
              <div style="background-color: #f8fafc; border: 2px dashed #0f2744; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
                <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                  Your One-Time Password
                </div>
                <div style="font-size: 34px; font-weight: 800; color: #0f2744; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">
                  ${otp}
                </div>
                <div style="font-size: 12px; color: #dc2626; margin-top: 8px; font-weight: 500;">
                  ⏱ Valid for 10 minutes only
                </div>
              </div>

              <p style="color: #6b7280; font-size: 13.5px; line-height: 1.5; margin: 20px 0 0 0;">
                If you did not initiate this request, you can safely ignore this email. Your password will remain unchanged, and your account is secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 6px 0;">
                This is an automated security email from CVRU Online. Please do not reply.
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                &copy; ${new Date().getFullYear()} Dr. C.V. Raman University Online. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
    };

    return await transporter.sendMail(mailOptions);
};

export default {
    sendPasswordResetOtpEmail,
};
