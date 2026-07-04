const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');

    if (!gmailUser || !gmailAppPassword) {
        throw new Error('Gmail email credentials are not configured');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail', // Or use 'host' and 'port' for other providers
        auth: {
            user: gmailUser,
            pass: gmailAppPassword,
        },
    });

    const message = {
        from: `"HaBITAW" <${gmailUser}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    await transporter.sendMail(message);
};

module.exports = sendEmail;
