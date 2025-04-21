// server.js - Complete backend for sending emails with images and HTML formatting

const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Create Express app
const app = express();

// Enable CORS and JSON parsing
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename but make it unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Configure multer to handle both content images and attachments
const upload = multer({ 
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit per file
    files: 20 // Maximum 20 files total
  }
}).fields([
  { name: 'contentImage', maxCount: 10 }, // For images embedded in content
  { name: 'attachment', maxCount: 10 }    // For file attachments
]);

// Email sending endpoint
app.post('/api/send-email', upload, async (req, res) => {
  try {
    // Parse the emailData from the request
    const emailData = JSON.parse(req.body.emailData);
    const { recipients, subject, content } = emailData;
    
    // Get files from both fields
    const contentImages = req.files['contentImage'] || [];
    const attachments = req.files['attachment'] || [];

    console.log('Received files:', {
      contentImages: contentImages.map(f => f.originalname),
      attachments: attachments.map(f => f.originalname)
    });

    // Validate inputs
    if (!recipients || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Parse recipients
    const emailList = Array.isArray(recipients) ? recipients : [recipients];

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Handle content images (inline)
    const cidMap = new Map();
    const inlineAttachments = contentImages.map(file => {
      const cid = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      cidMap.set(file.originalname, cid);
      return {
        filename: file.originalname,
        path: file.path,
        cid: cid,
        contentType: file.mimetype,
        contentDisposition: 'inline'
      };
    });

    // Handle regular attachments
    const fileAttachments = attachments.map(file => ({
      filename: file.originalname,
      path: file.path,
      contentType: file.mimetype,
      contentDisposition: 'attachment'
    }));

    // Replace image sources in the content with CIDs
    let modifiedContent = content;
    const imgRegex = /<img[^>]+src="[^"]+"/g;
    const matches = content.match(imgRegex) || [];
    
    matches.forEach((imgTag, index) => {
      if (index < contentImages.length) {
        const file = contentImages[index];
        const cid = cidMap.get(file.originalname);
        // Replace the entire img tag while preserving other attributes and wrap with custom class
        modifiedContent = modifiedContent.replace(
          imgTag,
          `<div class="email-image-container" style="margin: 10px 0; text-align: center;">
            ${imgTag.replace(
              /src="[^"]+"/,
              `src="cid:${cid}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;"`
            )}
          </div>`
        );
      }
    });

    // Add base styling for the email content
    const styledContent = `
      <div style="
        max-width: ${emailData.design?.maxWidth || '600px'};
        margin: 0 auto;
        background-color: ${emailData.design?.backgroundColor || '#ffffff'};
        padding: ${emailData.design?.padding || '20px'};
        border: ${emailData.design?.borderWidth || '1px'} ${emailData.design?.borderStyle || 'solid'} ${emailData.design?.borderColor || '#e0e0e0'};
        border-radius: ${emailData.design?.borderRadius || '8px'};
        font-family: ${emailData.design?.fontFamily || 'Arial, sans-serif'};
        line-height: 1.5;
        color: #333;
      ">
        <style>
          .email-image-container {
            margin: 10px 0;
            text-align: start;
            width: 100%;
            position: relative;
          }
          .email-image-container img {
            width: 100%;
            height: auto;
            object-fit: contain;
            display: block;
          }
        </style>
        <div style="width: 80%; margin: 0 auto;">
          ${modifiedContent}
        </div>
      </div>
    `;

    // Log for debugging
    console.log('Sending email with:', {
      contentImages: inlineAttachments.map(a => a.filename),
      attachments: fileAttachments.map(a => a.filename),
      cidMap: Object.fromEntries(cidMap)
    });

    // Send emails
    const results = await Promise.all(emailList.map(email => {
      return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        html: styledContent,
        attachments: [
          ...inlineAttachments,
          ...fileAttachments
        ]
      });
    }));

    // Cleanup uploaded files
    [...contentImages, ...attachments].forEach(file => {
      fs.unlink(file.path, err => {
        if (err) console.error('Error deleting file:', err);
      });
    });

    res.json({
      success: true,
      message: `Emails sent successfully to ${emailList.length} recipients`,
      results: results.map(r => r.messageId)
    });

  } catch (error) {
    console.error('Error sending emails:', error);
    
    // Cleanup any uploaded files in case of error
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        fs.unlink(file.path, err => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send emails',
      error: error.message
    });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Make sure to set up your email configuration in the .env file!`);
});




