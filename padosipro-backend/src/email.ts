import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,
  secure: false, 
});

export async function sendOTPEmail(to: string, otp: string) {
  const mailOptions = {
    from: '"Padosi Pro" <hello@padosipro.com>',
    to,
    subject: 'Your Verification Code',
    text: `Your 6-digit verification code is: ${otp}\n\nIt is valid for 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
}