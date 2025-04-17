// server.js - Complete backend for sending emails with images and HTML formatting

const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create Express app
const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Store uploads in the 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Create unique filenames with original extension
    cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
  }
});

// Set up multer middleware with file filter for images
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Endpoint for sending emails with images and HTML formatting
app.post('/api/send-emails', upload.array('images'), async (req, res) => {
  try {
    // Get form data
    let recipients = req.body.recipients;
    const subject = req.body.subject;
    let message = req.body.message;
    const files = req.files || []; // Uploaded files
    const embedImages = req.body.embedImages === 'true'; // Check if images should be embedded
    const isHtmlFormat = req.body.htmlFormat === 'true'; // Check if message is HTML formatted
    
    console.log("Message format:", isHtmlFormat ? "HTML" : "Plain text");
    
    // Ensure recipients is always an array
    if (!Array.isArray(recipients)) {
      recipients = [recipients];
    }
    
    // Validate inputs
    if (!recipients || recipients.length === 0 || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // common options: gmail, outlook, yahoo, etc.
      auth: {
      user: 'namp280918@gmail.com', 
        pass: 'jawv mfom kepg lkmt',
      }
    });
    
    // Process images - either as attachments or inline embedded images
    let attachments = [];
    let htmlMessage = isHtmlFormat ? message : message.replace(/\n/g, '<br>');
    
    if (files.length > 0) {
      if (embedImages) {
        // For embedded images in the email body
        if (!isHtmlFormat) {
          // If the message is not already HTML, wrap it
          htmlMessage += '<div style="margin-top: 20px;">';
        } else {
          // If it's already HTML, find the closing body tag or add to the end
          const bodyCloseIndex = htmlMessage.toLowerCase().indexOf('</body>');
          if (bodyCloseIndex !== -1) {
            // Insert before closing body tag
            htmlMessage = htmlMessage.substring(0, bodyCloseIndex) + 
                          '<div style="margin-top: 20px;">' +
                          htmlMessage.substring(bodyCloseIndex);
          } else {
            // Add to the end
            htmlMessage += '<div style="margin-top: 20px;">';
          }
        }
        
        files.forEach((file, index) => {
          // Generate a unique content ID for each image
          const contentId = `image-${index}-${crypto.randomBytes(10).toString('hex')}`;
          
          // Add image to the HTML content
          htmlMessage += `<div style="margin-bottom: 15px;">
            <img src="cid:${contentId}" alt="Embedded Image ${index + 1}" style="max-width: 100%; height: auto;" />
          </div>`;
          
          // Add the image as an embedded attachment
          attachments.push({
            filename: path.basename(file.originalname),
            path: file.path,
            cid: contentId, // Content ID referenced in the HTML
            contentDisposition: 'inline'
          });
        });
        
        htmlMessage += '</div>';
        
        if (!isHtmlFormat) {
          // Close any wrapper elements if not already HTML
          htmlMessage += '</div>';
        } else {
          // Close the div we added
          const bodyCloseIndex = htmlMessage.toLowerCase().indexOf('</body>');
          if (bodyCloseIndex !== -1) {
            // Insert closing div before closing body tag
            htmlMessage = htmlMessage.substring(0, bodyCloseIndex) + 
                          '</div>' +
                          htmlMessage.substring(bodyCloseIndex);
          } else {
            // Add to the end
            htmlMessage += '</div>';
          }
        }
      } else {
        // Regular attachments (not embedded)
        attachments = files.map(file => ({
          filename: path.basename(file.originalname),
          path: file.path,
          contentType: file.mimetype
        }));
      }
    }
    
    // If HTML content was sent, fix any potential RTL issues
    if (isHtmlFormat) {
      // Force LTR direction on all content
      htmlMessage = `<div dir="ltr" style="direction: ltr; unicode-bidi: embed;">${htmlMessage}</div>`;
    }
    
    // Send emails to all recipients
    const emailPromises = recipients.map(recipient => {
      const mailOptions = {
        from: 'your-email@gmail.com', // YOUR EMAIL ADDRESS HERE (same as above)
        to: recipient,
        subject: subject,
        text: isHtmlFormat ? htmlToText(message) : message, // Plain text version
        html: htmlMessage, // HTML version
        attachments: attachments
      };
      
      return transporter.sendMail(mailOptions);
    });
    
    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    
    // Return success response
    res.status(200).json({ 
      success: true, 
      message: `Emails sent successfully to ${recipients.length} recipients`,
      details: results.map(r => r.messageId)
    });
    
  } catch (error) {
    console.error('Error sending emails:', error);
    
    // Return error response
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send emails',
      error: error.message 
    });
  }
});

// Helper function to convert HTML to plain text (basic version)
function htmlToText(html) {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Replace ampersands
    .replace(/&lt;/g, '<') // Replace less than
    .replace(/&gt;/g, '>') // Replace greater than
    .trim(); // Trim whitespace
}

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Make sure to update the email configuration in the code!`);
});




// user: 'namp280918@gmail.com', 
// pass: 'jawv mfom kepg lkmt',