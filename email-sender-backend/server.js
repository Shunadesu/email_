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
  origin: 'http://localhost:5173',  // Allow only local development frontend
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Origin'],
  exposedHeaders: ['Access-Control-Allow-Origin'],
  credentials: false
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add OPTIONS handler for the email endpoint
app.options('/api/send-email', cors({
  origin: ['https://email-fca1.vercel.app', 'http://localhost:5173'],
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Origin'],
  credentials: true
}));

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
  const uploadedFiles = [];
  try {
    console.log('Raw req.body:', req.body); // Log the raw body received

    // Check if emailData field exists
    if (!req.body.emailData) {
      return res.status(400).json({ error: 'Missing emailData field in request body' });
    }

    // Parse emailData from JSON string
    let emailData;
    try {
      emailData = JSON.parse(req.body.emailData);
    } catch (parseError) {
      console.error('Failed to parse emailData JSON:', parseError);
      return res.status(400).json({ error: 'Invalid emailData format - failed to parse JSON', details: parseError.message });
    }

    console.log('Parsed emailData:', emailData); // Log the parsed object

    // Track uploaded files (do this early)
    if (req.files) {
      uploadedFiles.push(...Object.values(req.files).flat());
    }

    // Validate parsed emailData content
    if (!emailData.recipients || !Array.isArray(emailData.recipients) || emailData.recipients.length === 0 || !emailData.subject || !emailData.content) {
      console.error('Validation failed:', { 
        recipients: emailData.recipients, 
        subject: emailData.subject, 
        content: emailData.content 
      });
      return res.status(400).json({ 
        error: 'Missing required fields in emailData',
        details: {
          recipients: (!emailData.recipients || !Array.isArray(emailData.recipients) || emailData.recipients.length === 0) ? 'Recipients array is required and cannot be empty' : null,
          subject: !emailData.subject ? 'Subject is required' : null,
          content: !emailData.content ? 'Email content is required' : null
        }
      });
    }

    // Destructure data *after* validation
    const { recipients, subject, content } = emailData;
    
    // Get files from req.files (multer populates this)
    const contentImages = req.files['contentImage'] || [];
    const attachments = req.files['attachment'] || [];

    console.log('Received files:', {
      contentImages: contentImages.map(f => f.originalname),
      attachments: attachments.map(f => f.originalname)
    });

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

    // Clean up files after successful send
    uploadedFiles.forEach(file => {
      fs.unlink(file.path, err => {
        if (err) console.error('Error deleting file after successful send:', err);
      });
    });

    res.json({
      success: true,
      message: `Emails sent successfully to ${emailList.length} recipients`,
      results: results.map(r => r.messageId)
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Clean up files in case of error
    uploadedFiles.forEach(file => {
      fs.unlink(file.path, err => {
        if (err) console.error('Error deleting file after error:', err);
      });
    });

    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Make sure to set up your email configuration in the .env file!`);
});




