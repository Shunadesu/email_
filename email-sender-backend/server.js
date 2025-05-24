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
const allowedOrigins = [
  'http://localhost:5173',  // Local development
  'https://email-fca1.vercel.app/', // Your frontend Vercel domain
//   'https://email-fca1.vercel.app'
];

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Blocked origin:', origin); // For debugging
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Origin'],
  exposedHeaders: ['Access-Control-Allow-Origin'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add OPTIONS handler for the email endpoint
app.options('/api/send-email', cors(corsOptions));

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

    // Nếu signature là undefined hoặc rỗng, thử lấy lại từ raw req.body.emailData
    let signature = emailData.signature;
    if (!signature && req.body.emailData) {
      try {
        const raw = req.body.emailData;
        const match = raw.match(/"signature":\s*"([\s\S]*?)",\s*"design"/);
        if (match && match[1]) {
          signature = match[1].replace(/\\n/g, '').replace(/\\+/g, '');
        }
      } catch (e) {}
    }

    console.log('Parsed emailData:', emailData);

    // Track uploaded files
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

    // Destructure data after validation
    const { recipients, cc, subject, content } = emailData;
    
    // Get files from req.files (multer populates this)
    const contentImages = req.files['contentImage'] || [];
    const attachments = req.files['attachment'] || [];

    console.log('Received files:', {
      contentImages: contentImages.map(f => f.originalname),
      attachments: attachments.map(f => f.originalname)
    });

    // Parse recipients
    const emailList = Array.isArray(recipients) ? recipients : [recipients];

    // Xử lý cc: loại bỏ email rỗng, trim, và nối thành chuỗi nếu cần
    let ccList = Array.isArray(cc) ? cc.map(e => e.trim()).filter(e => e) : [];
    if (ccList.length === 0) ccList = undefined;

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
        // Replace the entire img tag while preserving other attributes
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

    // Get design from emailData
    const design = emailData.design || {};
    const borderColor = design.borderColor || '#0099FF';
    const borderWidth = design.borderWidth || '3px';
    const borderStyle = design.borderStyle || 'solid';
    const maxWidth = design.maxWidth || '600px';
    const padding = design.padding || '20px';
    const lineHeight = design.lineHeight || '1.5';

    // Add base styling for the email content
    const styledContent = `
      <div style="
        margin: 0 auto;
        background: #fff;
        border-radius: 12px;
        border: ${borderWidth} ${borderStyle} ${borderColor};
        padding: ${padding};
        max-width: ${maxWidth};
        line-height: ${lineHeight};
        font-family: Arial, sans-serif;
      ">
        <div style="width: 80%; margin: 0 auto;">
          ${modifiedContent}
        </div>
      </div>
      ${signature ? `<div style="width: 100%">${signature}</div>` : ''}
    `;

    // Send emails
    const results = await Promise.all(emailList.map(email => {
      return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        cc: ccList ? ccList.join(',') : undefined,
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
      message: `Email sent successfully to ${emailList.length} recipient(s)`,
      results: results.map(r => ({ 
        messageId: r.messageId,
        accepted: r.accepted,
        rejected: r.rejected
      }))
    });

  } catch (error) {
    console.error('Error sending email:', error);

    // Clean up files on error
    uploadedFiles.forEach(file => {
      fs.unlink(file.path, err => {
        if (err) console.error('Error deleting file after error:', err);
      });
    });

    res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 