import React, { useState, useRef, useMemo, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Send, Plus, Trash2, Image, Paperclip, File, Settings } from 'lucide-react';
import { 
  TextField, 
  Button, 
  IconButton, 
  Paper, 
  Box, 
  Typography, 
  Chip, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import toast from 'react-hot-toast';

const EmailSender = () => {
  const [recipients, setRecipients] = useState(['']);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [contentImages, setContentImages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const quillRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Design customization
  const [design, setDesign] = useState({
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    borderColor: '#e0e0e0',
    borderWidth: '1px',
    borderStyle: 'solid',
    fontFamily: 'Arial, sans-serif'
  });

  // Font options
  const fontOptions = [
    'Arial, sans-serif',
    'Georgia, serif',
    'Tahoma, sans-serif',
    'Times New Roman, serif',
    'Verdana, sans-serif',
    'Courier New, monospace'
  ];

  // Border style options
  const borderStyleOptions = ['solid', 'dashed', 'dotted', 'double', 'none'];

  const theme = useTheme();

  // Custom styles for components
  const styles = {
    container: {
      height: 'calc(100vh - 2rem)', // Trừ đi padding của container cha
      maxWidth: '1400px',
      margin: '0 auto',
    },
    paper: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: theme.spacing(2),
      overflow: 'hidden',
      boxShadow: theme.shadows[3],
    },
    header: {
      padding: theme.spacing(2, 4),
      background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.1)})`,
      borderBottom: `1px solid ${theme.palette.divider}`,
      flexShrink: 0, // Prevent header from shrinking
    },
    content: {
      padding: theme.spacing(3),
      height: '100%',
      overflow: 'hidden', // Hide overflow
    },
    mainContentWrapper: {
      display: 'flex',
      gap: 3,
      height: '100%',
      overflow: 'hidden',
    },
    leftSide: {
      flex: 1,
      minWidth: 0,
      overflow: 'auto', // Enable scrolling
      paddingRight: theme.spacing(2),
    },
    rightSide: {
      width: '45%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    section: {
      marginBottom: theme.spacing(3),
      '& .MuiTypography-subtitle1': {
        marginBottom: theme.spacing(1.5),
        color: theme.palette.text.primary,
        fontWeight: 600,
      }
    },
    recipientContainer: {
      display: 'flex',
      gap: theme.spacing(1.5),
      alignItems: 'center',
      marginBottom: theme.spacing(1.5),
    },
    addRecipientButton: {
      marginTop: theme.spacing(1),
    },
    designControls: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: theme.spacing(2.5),
      marginTop: theme.spacing(2),
    },
    messageContainer: {
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.shape.borderRadius,
      overflow: 'hidden',
      '& .ql-container': {
        height: '250px', // Fixed height for editor
      }
    },
    previewContainer: {
      flex: 1,
      overflow: 'auto',
      padding: theme.spacing(2),
      backgroundColor: alpha(theme.palette.background.paper, 0.5),
      borderRadius: theme.shape.borderRadius,
      backdropFilter: 'blur(8px)',
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    },
    attachmentChip: {
      margin: theme.spacing(0.5),
    },
    sendButton: {
      marginTop: theme.spacing(4),
      padding: theme.spacing(1.5, 4),
      fontWeight: 600,
      fontSize: '1rem',
    },
  };

  // Thêm custom styles cho Quill editor
  const customStyles = `
    .ql-editor {
      font-size: 16px;
      line-height: 1.6;
      padding: 20px;
    }
    
    .ql-toolbar {
      padding: 12px !important;
    }
    
    .ql-formats button {
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    .ql-editor img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 16px auto;
    }
    
    .ql-editor p {
      margin-bottom: 1em;
    }
    
    .ql-snow .ql-picker {
      height: 32px;
    }
    
    .ql-snow .ql-stroke {
      stroke-width: 1.5;
    }
  `;

  // Modified image handler for content images
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const range = quillRef.current.getEditor().getSelection(true);
          
          // Insert the image using Quill's native insertEmbed
          quillRef.current.getEditor().insertEmbed(
            range.index,
            'image',
            e.target.result
          );
          
          // Store the file for later sending
          setContentImages(prev => [...prev, {
            file,
            type: 'inline',
            name: file.name,
            dataUrl: e.target.result
          }]);
        };
        reader.readAsDataURL(file);
      }
    };
  };

  // Modified drop handler for content images
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const range = quillRef.current.getEditor().getSelection() || { index: quillRef.current.getEditor().getLength() };
        
        // Insert the image using Quill's native insertEmbed
        quillRef.current.getEditor().insertEmbed(
          range.index,
          'image',
          e.target.result
        );

        // Store the file for later sending
        setContentImages(prev => [...prev, {
          file,
          type: 'inline',
          name: file.name,
          dataUrl: e.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Quill modules configuration
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  // Quill formats
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
    'list', 'bullet',
    'link', 'image'
  ];

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChange = (index, value) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const removeRecipient = (index) => {
    if (recipients.length > 1) {
      const newRecipients = recipients.filter((_, i) => i !== index);
      setRecipients(newRecipients);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024).toFixed(1) // Convert to KB
    }));
    setContentImages([...contentImages, ...newImages]);
  };

  const removeImage = (index) => {
    const newImages = contentImages.filter((_, i) => i !== index);
    setContentImages(newImages);
  };

  const handleDesignChange = (property, value) => {
    setDesign(prev => ({
      ...prev,
      [property]: value
    }));
  };

  // Handle file attachments
  const handleFileAttachment = (e) => {
    const files = Array.from(e.target.files).map(file => ({
      file,
      type: 'attachment',
      name: file.name
    }));
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email addresses
    const invalidEmails = recipients.filter(email => !validateEmail(email.trim()));
    
    if (invalidEmails.length > 0) {
      setError(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      return;
    }

    // Create FormData
    const formData = new FormData();
    
    // Add email data
    const emailData = {
      recipients: recipients.filter(email => email.trim() !== ''),
      subject,
      content: content,
      design: {
        backgroundColor: design.backgroundColor,
        padding: design.padding,
        borderWidth: design.borderWidth,
        borderStyle: design.borderStyle,
        borderColor: design.borderColor,
        borderRadius: design.borderRadius,
        maxWidth: '600px',
        fontFamily: design.fontFamily
      }
    };

    // Validate required fields
    if (emailData.recipients.length === 0) {
      setError('Please add at least one recipient');
      return;
    }
    if (!subject) {
      setError('Please enter a subject');
      return;
    }
    if (!content) {
      setError('Please enter some content');
      return;
    }

    formData.append('emailData', JSON.stringify(emailData));

    // Add content images (for inline display)
    contentImages.forEach(item => {
      formData.append('contentImage', item.file);
    });

    // Add attachments
    attachments.forEach(item => {
      formData.append('attachment', item.file);
    });

    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const response = await fetch('http://localhost:5000/api/send-email', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Origin': 'http://localhost:5173'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Email sent successfully!');
        // Clear form
        setRecipients(['']);
        setSubject('');
        setContent('');
        setContentImages([]);
        setAttachments([]);
        quillRef.current.getEditor().setContents([]);
      } else {
        setError(result.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Preview component for inline images
  const InlineImagePreview = ({ dataUrl, name, onDelete }) => (
    <Box sx={{ 
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      padding: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      maxWidth: '250px'
    }}>
      <img 
        src={dataUrl} 
        alt={name}
        style={{ 
          width: '40px',
          height: '40px',
          objectFit: 'contain'
        }}
      />
      <Typography variant="body2" noWrap sx={{ flex: 1 }}>
        {name}
      </Typography>
      <IconButton size="small" onClick={onDelete}>
        <Trash2 size={16} />
      </IconButton>
    </Box>
  );

  return (
    <>
      <style>{customStyles}</style>
      <Box sx={styles.container}>
        <Paper sx={styles.paper}>
          {/* Header */}
          <Box sx={styles.header}>
            <Typography variant="h5" gutterBottom>
              Email Composer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and send professional emails with our advanced editor
            </Typography>
          </Box>

          {/* Main Content */}
          <Box sx={styles.content}>
            <Box sx={styles.mainContentWrapper}>
              {/* Left side - Editor and controls */}
              <Box sx={styles.leftSide}>
                {/* Recipients Section */}
                <Box sx={styles.section}>
                  <Typography variant="subtitle1">
                    Recipients
                  </Typography>
                  {recipients.map((email, index) => (
                    <Box key={index} sx={styles.recipientContainer}>
                      <TextField
                        fullWidth
                        size="medium"
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        error={email && !validateEmail(email)}
                        helperText={email && !validateEmail(email) ? 'Invalid email format' : ''}
                        placeholder="recipient@example.com"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'background.paper',
                          }
                        }}
                      />
                      {recipients.length > 1 && (
                        <IconButton 
                          color="error" 
                          onClick={() => removeRecipient(index)}
                          sx={{ 
                            backgroundColor: alpha(theme.palette.error.main, 0.1),
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.2),
                            }
                          }}
                        >
                          <Trash2 size={20} />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  <Button
                    startIcon={<Plus size={20} />}
                    onClick={addRecipient}
                    variant="text"
                    sx={{
                      mt: 2,
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      }
                    }}
                  >
                    Add Recipient
                  </Button>
                </Box>

                {/* Subject */}
                <Box sx={styles.section}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    size="small"
                  />
                </Box>

                {/* Design Customization Accordion */}
                <Accordion sx={{ mb: 3 }}>
                  <AccordionSummary
                    expandIcon={<KeyboardArrowDownIcon />}
                    aria-controls="design-content"
                    id="design-header"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Settings size={20} />
                      <Typography>Email Design</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={styles.designControls}>
                      <TextField
                        label="Background"
                        type="color"
                        value={design.backgroundColor}
                        onChange={(e) => handleDesignChange('backgroundColor', e.target.value)}
                        size="small"
                      />
                      <TextField
                        label="Border Color"
                        type="color"
                        value={design.borderColor}
                        onChange={(e) => handleDesignChange('borderColor', e.target.value)}
                        size="small"
                      />
                      <TextField
                        label="Border Width"
                        type="number"
                        value={parseInt(design.borderWidth)}
                        onChange={(e) => handleDesignChange('borderWidth', `${e.target.value}px`)}
                        size="small"
                        inputProps={{ min: 0, max: 10 }}
                      />
                      <TextField
                        label="Border Radius"
                        type="number"
                        value={parseInt(design.borderRadius)}
                        onChange={(e) => handleDesignChange('borderRadius', `${e.target.value}px`)}
                        size="small"
                        inputProps={{ min: 0, max: 20 }}
                      />
                      <FormControl size="small">
                        <InputLabel>Border Style</InputLabel>
                        <Select
                          value={design.borderStyle}
                          label="Border Style"
                          onChange={(e) => handleDesignChange('borderStyle', e.target.value)}
                        >
                          {borderStyleOptions.map(style => (
                            <MenuItem key={style} value={style}>
                              {style.charAt(0).toUpperCase() + style.slice(1)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small">
                        <InputLabel>Font Family</InputLabel>
                        <Select
                          value={design.fontFamily}
                          label="Font Family"
                          onChange={(e) => handleDesignChange('fontFamily', e.target.value)}
                        >
                          {fontOptions.map(font => (
                            <MenuItem key={font} value={font} sx={{ fontFamily: font }}>
                              {font.split(',')[0]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Message Content */}
                <Box sx={styles.section}>
                  <Typography variant="subtitle1">
                    Message Content
                  </Typography>
                  <Box sx={styles.messageContainer}>
                    <ReactQuill
                      ref={quillRef}
                      value={content}
                      onChange={setContent}
                      modules={modules}
                      formats={formats}
                      theme="snow"
                      placeholder="Write your message here..."
                    />
                  </Box>
                </Box>

                {/* Attachments */}
                <Box sx={styles.section}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                    Attachments
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {attachments.map((item, index) => (
                      <Chip
                        key={index}
                        icon={<File size={16} />}
                        label={`${item.name} (${(item.file.size / 1024).toFixed(1)}KB)`}
                        onDelete={() => removeAttachment(index)}
                        sx={styles.attachmentChip}
                      />
                    ))}
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<Paperclip size={20} />}
                    onClick={() => attachmentInputRef.current?.click()}
                    size="small"
                  >
                    Add Attachments
                  </Button>
                  <input
                    type="file"
                    ref={attachmentInputRef}
                    hidden
                    multiple
                    onChange={handleFileAttachment}
                  />
                </Box>

                {/* Send Button */}
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={loading ? null : <Send size={20} />}
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={styles.sendButton}
                >
                  {loading ? 'Sending...' : 'Send Email'}
                </Button>
              </Box>

              {/* Right side - Live Preview */}
              <Box sx={styles.rightSide}>
                <Box sx={styles.previewContainer}>
                  <Typography variant="subtitle1" gutterBottom>
                    Live Preview
                  </Typography>
                  
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      <strong>To:</strong> {recipients.filter(validateEmail).join(', ')}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      <strong>Subject:</strong> {subject}
                    </Typography>
                    {attachments.length > 0 && (
                      <Typography variant="body2">
                        <strong>Attachments:</strong> {attachments.length} files
                      </Typography>
                    )}
                  </Paper>

                  <Box sx={{
                    backgroundColor: design.backgroundColor,
                    padding: design.padding,
                    border: `${design.borderWidth} ${design.borderStyle} ${design.borderColor}`,
                    borderRadius: design.borderRadius,
                    minHeight: '200px',
                    fontFamily: design.fontFamily,
                    '& img': {
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: '4px',
                    },
                  }}>
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default EmailSender; 