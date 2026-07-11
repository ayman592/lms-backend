import dotenv from "dotenv";
import nodemailer from "nodemailer";
import jsend from "jsend";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to, otp) => {
  try {
    console.log("Sending email to:", to);
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}`,
    });
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Failed to send email");
  }
};
