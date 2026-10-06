import nodemailer from 'nodemailer';
import Contact from '../models/Contact.js';

export const submitContactForm = async (req, res, next) => {
    try {
        const { firstName, lastName, email, phone, program, message } = req.body;

        // Basic validation
        if (!firstName || !lastName || !email || !phone || !message) {
            return res.status(400).json({ status: 'fail', message: 'Please provide all required fields.' });
        }

        // Save to database
        const newContact = await Contact.create({
            firstName,
            lastName,
            email,
            phone,
            program: program || 'Not Specified',
            message
        });

        // Configure nodemailer transport
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Setup email data
        const mailOptions = {
            from: `"${firstName} ${lastName}" <${email}>`,
            to: process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_USER, // receiver email
            replyTo: email,
            subject: `New Contact Inquiry: ${firstName} ${lastName} - ${program ? program.toUpperCase() : 'General'}`,
            text: `
NEW CONTACT INQUIRY
================================

You have received a new message from the website contact form.

--- APPLICANT DETAILS ---
Name: ${firstName} ${lastName}
Email: ${email}
Phone: ${phone}
Program: ${program ? program.toUpperCase() : 'Not Specified'}

--- MESSAGE ---
${message}

================================
This email was generated automatically from the contact form. 
Please reply directly to the applicant's email address.
            `,
            html: `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eaebed; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
    <div style="text-align: center; padding-bottom: 25px; border-bottom: 2px solid #f3f4f6;">
        <h2 style="color: #0a1b3f; margin: 0; font-size: 24px; letter-spacing: -0.5px;">New Contact Inquiry</h2>
        <p style="color: #6b7280; font-size: 15px; margin-top: 8px;">You have received a new message from the website.</p>
    </div>
    
    <div style="padding: 25px 0;">
        <h3 style="color: #1f2937; margin-bottom: 20px; font-size: 17px; border-left: 4px solid #f97316; padding-left: 12px; font-weight: 600;">Applicant Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; width: 35%; color: #6b7280; font-weight: 500; font-size: 14px;">Full Name</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-weight: 600; font-size: 15px;">${firstName} ${lastName}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-weight: 500; font-size: 14px;">Email Address</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-size: 15px;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${email}</a></td>
            </tr>
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-weight: 500; font-size: 14px;">Phone Number</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-size: 15px;"><a href="tel:${phone}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${phone}</a></td>
            </tr>
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-weight: 500; font-size: 14px;">Program</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #1f2937;">
                    <span style="background-color: #eff6ff; color: #1d4ed8; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block;">
                        ${program ? program.toUpperCase() : 'Not Specified'}
                    </span>
                </td>
            </tr>
        </table>

        <h3 style="color: #1f2937; margin-bottom: 15px; font-size: 17px; border-left: 4px solid #f97316; padding-left: 12px; font-weight: 600;">Message Content</h3>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 10px; color: #374151; line-height: 1.7; font-size: 15px; border: 1px solid #e5e7eb; white-space: pre-wrap; font-family: inherit;">
${message}
        </div>
    </div>
    
    <div style="text-align: center; padding-top: 25px; border-top: 2px solid #f3f4f6; color: #9ca3af; font-size: 13px; line-height: 1.5;">
        <p style="margin: 0;">This email was generated automatically from the Contact Form.</p>
        <p style="margin: 6px 0 0 0;">You can reply directly to this email to contact the applicant.</p>
    </div>
</div>
            `
        };

        // Send mail
        try {
            let info = await transporter.sendMail(mailOptions);
            console.log("Message sent: %s", info.messageId);
        } catch (mailError) {
            console.error("Email send error, but saved to DB: ", mailError);
            // We still return success since it's saved in the DB.
        }
        
        // Return success
        res.status(200).json({
            status: 'success',
            message: 'Your message has been sent successfully.'
        });
    } catch (error) {
        console.error("Contact form error: ", error);
        res.status(500).json({
            status: 'error',
            message: 'There was an error saving your message. Please try again later.'
        });
    }
};
