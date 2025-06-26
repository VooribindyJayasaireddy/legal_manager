const nodemailer = require('nodemailer');

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your email password or app password
  },
});

// Function to send email
const sendEmail = async (options) => {
  try {
    // Define email options
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'LegalConnect'}" <${process.env.EMAIL_FROM_EMAIL || process.env.EMAIL_USERNAME}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      // You can also add HTML version of the email
      // html: options.html || options.message
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to', options.email);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
