// emailUtils.js
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Function to create a Nodemailer transporter
function createTransporter() {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASS,
        },
        tls: { rejectUnauthorized: true },
    });

    // Check for success and log the message
    transporter.verify((error, success) => {
        if (error) {
            console.log('Error verifying transporter:', error);
        } else {
            console.log('NODE MAILER IS ACTIVE');
        }
    });

    return transporter;
}

// Function to send the email using the transporter and mail options
async function sendEmail(transporter, mailOptions) {
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.response);
    } catch (error) {
        console.log('Problem sending Email: ', error);
        throw new Error('Failed to send email');
    }
}

module.exports = {
    createTransporter,
    sendEmail,
};
