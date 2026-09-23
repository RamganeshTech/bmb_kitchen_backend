import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

export const sendResetPasswordEmail = async (
    to: string,
    resetLink: string,
    userName: string
): Promise<void> => {
    const mailOptions = {
        from: `"Civil Mind Pro" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Password Reset Request",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h2 style="color: #1e293b;">Password Reset Request</h2>
                <p>Hello ${userName},</p>
                <p>We received a request to reset your password. This link is valid for <strong>15 minutes</strong>.</p>
                <p>If you did not request this, ignore this email.</p>
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Reset Your Password
                    </a>
                </div>
                <p style="font-size: 14px; word-break: break-all; color: #3b82f6;">${resetLink}</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};