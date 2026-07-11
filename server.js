// Wasewe Contractors backend (Node.js + Express)
// ----------------------------------------------
// Setup instructions:
// 1) Initialize package.json:
//    npm init -y
// 2) Install dependencies:
//    npm install express cors nodemailer dotenv
// 3) Create a .env file in the project root with:
//    EMAIL_USER=yourgmailaccount@gmail.com
//    EMAIL_PASS=your_apppassword_or_oauth_token
// 4) Run the server:
//    node server.js
// 5) Frontend should POST to http://localhost:5000/contact

// Modern, scalable structure for future expansion (auth, DB, etc.).

import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check / base endpoint
app.get('/', (req, res) => {
  res.send('Wasewe Contractors Backend Running...');
});

// Contact endpoint
app.post('/contact', async (req, res) => {
  try {
    const { name, phone, email, service, message } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
    }
    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return res.status(400).json({ error: 'Phone is required and must be a non-empty string of digits' });
    }
    if (!/^[0-9]+$/.test(phone.trim())) {
      return res.status(400).json({ error: 'Phone number must contain digits only' });
    }
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ error: 'Email is required and must be a non-empty string' });
    }
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
    }

    const senderEmail = process.env.EMAIL_USER;
    const senderPass = process.env.EMAIL_PASS;

    if (!senderEmail || !senderPass) {
      return res.status(500).json({ error: 'Email configuration is missing on server side' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: senderEmail,
        pass: senderPass,
      },
    });

    const serviceName = service && typeof service === 'string' && service.trim() ? service.trim() : 'General';

    const mailOptions = {
      from: senderEmail,
      to: 'wasewecontractors@gmail.com',
      subject: `New Client Inquiry - ${serviceName}`,
      text: `New contact request from Wasewe Contractors website:\n\nName: ${name.trim()}\nPhone: ${phone.trim()}\nEmail: ${email.trim()}\nService: ${serviceName}\nMessage: ${message.trim()}\n`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error in /contact route:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// Global error handler (future expand for structured error logging)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Wasewe Contractors backend is running on http://localhost:${PORT}`);
});
