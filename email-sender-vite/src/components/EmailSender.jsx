import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Send, Plus, Trash2, Image, Paperclip, File, Settings, ExternalLink, Moon, Sun } from 'lucide-react';
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
  alpha,
  CircularProgress,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const EmailSender = () => {
  const [recipients, setRecipients] = useState(['']);
  const [cc, setCc] = useState(['']);
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
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [signature, setSignature] = useState(
    `<div style="color:#f5a623; font-size:1.1em; font-weight:bold; margin-bottom:4px; text-align:left;">Lê Hà Minh Anh</div>
    <div style="color:#f5a623; font-size:0.98em; font-weight:500; margin-bottom:7px; text-align:left;">Student K21<br>Faculty of Languages - International Cultures</div>
    <div style="margin-bottom:7px; text-align:left;"><span style="color:#1976d2;">🌐</span> <a href="https://hoasen.edu.vn" style="color:#1976d2; text-decoration:none;">https://hoasen.edu.vn</a></div>
    <div style="margin-bottom:7px; text-align:left;"><span style="color:#1976d2;">📍</span> 8 Nguyen Van Trang, Ben Thanh ward, Dist. 1, HCMC</div>
    <div style="margin-top:10px; color:#f5a623; font-size:0.93em; padding-top:7px; text-align:left;">WORLD CLASS EDUCATION - DIVERSITY EMBRACE - ENTREPRENEURIAL SPIRIT</div>`
  );
  const [isSignatureHtmlMode, setIsSignatureHtmlMode] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isHtmlFullscreen, setIsHtmlFullscreen] = useState(false);
  const [isSignatureHtmlFullscreen, setIsSignatureHtmlFullscreen] = useState(false);

  // Design customization
  const [design, setDesign] = useState({
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    borderColor: '#e0e0e0',
    borderWidth: '1px',
    borderStyle: 'solid',
    fontFamily: 'Arial, sans-serif',
    lineHeight: '1.5',
    maxWidth: '600px',
    minHeight: '400px', // default
  });

  // Font options
  const fontOptions = [
    'Georgia, serif',
    'Times New Roman, serif',
    'Arial, sans-serif',
    'Tahoma, sans-serif',
    'Verdana, sans-serif',
    'Courier New, monospace',
    'Playfair Display, serif',
    'EB Garamond, serif',
    'Merriweather, serif',
    'Cormorant Garamond, serif',
    'Abril Fatface, cursive',
    'Lora, serif',
    'Cinzel, serif',
    'DM Serif Display, serif',
    'Montserrat, sans-serif',
    'Poppins, sans-serif',
    'Raleway, sans-serif',
    'Quicksand, sans-serif',
    'Rubik, sans-serif',
    'Fira Sans, sans-serif',
    'Nunito, sans-serif',
    'Oswald, sans-serif',
    'Pacifico, cursive',
    'Dancing Script, cursive',
    'Great Vibes, cursive',
    'Satisfy, cursive',
    'Sacramento, cursive'
  ];

  // Border style options
  const borderStyleOptions = ['solid', 'dashed', 'dotted', 'double', 'none'];

  const theme = useTheme();

  // Custom styles for components
  const styles = {
    container: {
      height: 'calc(100vh - 2rem)',
      maxWidth: '1400px',
      margin: '0 auto',
      background: isDarkMode ? '#181c23' : '#eaf6fb',
      fontFamily: design.fontFamily,
      padding: '1.5rem 0',
      color: isDarkMode ? '#f5f5f5' : undefined,
    },
    paper: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 12,
      overflow: 'hidden',
      background: isDarkMode ? '#23272f' : '#fff',
      border: `1.5px solid ${isDarkMode ? '#374151' : '#90caf9'}`,
      boxShadow: 'none',
      color: isDarkMode ? '#f5f5f5' : undefined,
    },
    header: {
      padding: '28px 40px 18px 40px',
      background: 'none',
      borderBottom: `1.5px solid ${isDarkMode ? '#374151' : '#90caf9'}`,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: design.fontFamily,
      color: isDarkMode ? '#f5f5f5' : undefined,
    },
    headerTitle: {
      fontFamily: design.fontFamily,
      fontWeight: 700,
      fontSize: '2.1rem',
      letterSpacing: '0.5px',
      color: isDarkMode ? '#90caf9' : '#1976d2',
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
    },
    headerDesc: {
      fontFamily: design.fontFamily,
      color: isDarkMode ? '#b3cde0' : '#1976d2',
      fontWeight: 400,
      fontSize: '1.05rem',
      marginTop: 4,
    },
    clock: {
      fontFamily: 'Fira Mono, monospace',
      fontSize: '1.1rem',
      color: isDarkMode ? '#90caf9' : '#1976d2',
      background: isDarkMode ? '#23272f' : '#fff',
      borderRadius: 6,
      px: 2,
      py: 0.5,
      fontWeight: 700,
      letterSpacing: '1.2px',
      border: `1px solid ${isDarkMode ? '#374151' : '#90caf9'}`,
      boxShadow: 'none',
    },
    content: {
      padding: 3,
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      color: isDarkMode ? '#f5f5f5' : undefined,
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
      overflow: 'auto',
      paddingRight: 2,
      color: isDarkMode ? '#f5f5f5' : undefined,
    },
    rightSide: {
      width: '45%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      color: isDarkMode ? '#f5f5f5' : undefined,
    },
    section: {
      marginBottom: theme.spacing(3),
      '& .MuiTypography-subtitle1': {
        marginBottom: theme.spacing(1.5),
        color: theme.palette.text.primary,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }
    },
    recipientContainer: {
      display: 'flex',
      gap: theme.spacing(1.5),
      alignItems: 'center',
      marginBottom: theme.spacing(1.5),
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateX(4px)',
      }
    },
    addRecipientButton: {
      marginTop: theme.spacing(1),
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
      }
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
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
      },
      '& .ql-container': {
        height: '250px',
      }
    },
    previewContainer: {
      flex: 1,
      overflow: 'auto',
      padding: 3,
      background: isDarkMode ? '#23272f' : '#fff',
      borderRadius: 10,
      border: `1.5px solid ${isDarkMode ? '#374151' : '#90caf9'}`,
      boxShadow: 'none',
      fontFamily: design.fontFamily,
      marginTop: 8,
      color: isDarkMode ? '#f5f5f5' : undefined,
    },
    attachmentChip: {
      margin: theme.spacing(0.5),
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[2],
      }
    },
    sendButton: {
      marginTop: 4,
      padding: '12px 32px',
      fontWeight: 700,
      fontSize: '1rem',
      borderRadius: 6,
      background: isDarkMode ? '#1976d2' : '#90caf9',
      color: '#fff',
      border: `1.5px solid ${isDarkMode ? '#1976d2' : '#90caf9'}`,
      boxShadow: 'none',
      '&:hover': {
        background: isDarkMode ? '#1565c0' : '#42a5f5',
        color: '#fff',
        boxShadow: 'none',
      },
      '&.Mui-disabled': {
        background: isDarkMode ? '#374151' : '#e3f2fd',
        color: '#fff',
        border: `1.5px solid ${isDarkMode ? '#374151' : '#e3f2fd'}`,
      }
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: alpha(theme.palette.background.paper, 0.8),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    },
    templateButton: {
      borderRadius: 6,
      background: isDarkMode ? '#23272f' : '#fff',
      color: isDarkMode ? '#90caf9' : '#1976d2',
      border: `1.2px solid ${isDarkMode ? '#374151' : '#90caf9'}`,
      fontWeight: 600,
      boxShadow: 'none',
      '&:hover': {
        background: isDarkMode ? '#181c23' : '#eaf6fb',
        color: isDarkMode ? '#90caf9' : '#1976d2',
        boxShadow: 'none',
      }
    },
    signaturePreview: {
      mt: 3,
      pt: 3,
      borderTop: `1px solid ${isDarkMode ? '#374151' : '#90caf9'}`,
      backgroundColor: isDarkMode ? '#181c23' : '#fff',
      fontFamily: design.fontFamily,
      fontStyle: 'italic',
      color: isDarkMode ? '#90caf9' : '#1976d2',
      borderRadius: 6,
      px: 2,
      py: 1,
    }
  };

  // Thêm custom styles cho Quill editor
  const customStyles = `
    .ql-editor {
      font-size: 16px;
      line-height: ${design.lineHeight};
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
          // Chèn ảnh với style max-width
          quillRef.current.getEditor().clipboard.dangerouslyPasteHTML(
            range.index,
            `<img src="${e.target.result}" style="max-width: 200px; height: auto; display: block; margin: 0 auto; border-radius: 8px;" />`
          );
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + Enter to send
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!loading && subject && content) {
          handleSubmit(e);
        }
      }
      // Ctrl/Cmd + B to toggle HTML mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        handleToggleHtmlMode();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [loading, subject, content]);

  // Enhanced Quill modules configuration
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean'],
        ['code-block'] // Add code block support
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false // Prevent unwanted formatting
    },
    keyboard: {
      bindings: {
        tab: false // Disable tab key to prevent focus issues
      }
    }
  }), []);

  // Enhanced Quill formats
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
    'list', 'bullet',
    'link', 'image',
    'code-block'
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

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Enhanced error handling
  const handleError = (message) => {
    setError(message);
    setSnackbar({
      open: true,
      message,
      severity: 'error'
    });
  };

  const handleSuccess = (message) => {
    setSuccess(message);
    setSnackbar({
      open: true,
      message,
      severity: 'success'
    });
  };

  // Enhanced submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email addresses
    const invalidEmails = recipients.filter(email => !validateEmail(email.trim()));
    
    if (invalidEmails.length > 0) {
      handleError(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      return;
    }

    // Validate required fields
    if (recipients.filter(email => email.trim() !== '').length === 0) {
      handleError('Please add at least one recipient');
      return;
    }
    if (!subject) {
      handleError('Please enter a subject');
      return;
    }
    if (!content) {
      handleError('Please enter some content');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create FormData
      const formData = new FormData();
      
      // Add email data
      const emailData = {
        recipients: recipients.filter(email => email.trim() !== ''),
        cc: cc.filter(email => email.trim() !== ''),
        subject,
        content: content,
        signature: signature,
        design: {
          backgroundColor: design.backgroundColor,
          padding: design.padding || '20px',
          borderWidth: design.borderWidth,
          borderStyle: design.borderStyle,
          borderColor: design.borderColor,
          borderRadius: design.borderRadius,
          maxWidth: design.maxWidth || '600px',
          fontFamily: design.fontFamily,
          lineHeight: design.lineHeight,
          minHeight: design.minHeight || '400px',
        }
      };

      formData.append('emailData', JSON.stringify(emailData));

      // Add content images (for inline display)
      contentImages.forEach(item => {
        formData.append('contentImage', item.file);
      });

      // Add attachments
      attachments.forEach(item => {
        formData.append('attachment', item.file);
      });

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/send-email`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const result = await response.json();
      
      if (result.success) {
        handleSuccess('Email sent successfully!');
        // Clear form
        setRecipients(['']);
        setSubject('');
        setContent('');
        setContentImages([]);
        setAttachments([]);
        if (quillRef.current && quillRef.current.getEditor) {
          quillRef.current.getEditor().setContents([]);
        }
      } else {
        handleError(result.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      handleError('Failed to send email. Please try again.');
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

  // Hàm đơn giản để format HTML (indent)
  function formatHtml(html) {
    let tab = '';
    return html
      .replace(/</g, '\n<')
      .replace(/\n\s*\n/g, '\n')
      .split('\n')
      .map(line => {
        if (line.match(/<\//)) tab = tab.substring(2);
        const result = tab + line;
        if (line.match(/<[^!/][^>]*[^/]>/) && !line.includes('</')) tab += '  ';
        return result;
      })
      .join('\n')
      .trim();
  }

  // Khi chuyển sang chế độ HTML, tự động format mã HTML
  const handleToggleHtmlMode = () => {
    setIsHtmlMode((prev) => {
      if (!prev) {
        setContent(formatHtml(content));
      }
      return !prev;
    });
  };

  // Card template HTML
  const cardTemplate = `
<div style="display: flex; flex-direction: column; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 20px; font-family: Arial, sans-serif; box-sizing: border-box;">
  <div style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 20px;">
    <div style=" min-width: 120px; max-width: 180px; height: 300px; text-align: center; margin-right: 20px;">
      <div style="min-width: 100px; max-width: 170px; margin: 0 auto 12px auto;">
        <img src="https://lh7-rt.googleusercontent.com/docsz/AD_4nXdnlIlswnP4mYd_CGv0sHpauYlH2eYz8imP_sSKgNzzd_vR8JLJCWFnKEBx38O7VR_trgYneKfwKcOyf9CI_yxQXu1k1h39_vQldax1hOdPr5rgIjhNkWbbZmkN1k-a-PGm1-nKHQ?key=zZgczEilgkhQFQm83e7rAg" alt="HOA SEN UNIVERSITY" style="width: 100%; height: auto; object-fit: contain;" />
      </div>
      <div style="max-width: 70px; height: 70px; margin: 12px auto 0 auto;">
        <img src="https://lh7-rt.googleusercontent.com/docsz/AD_4nXc9fxzOW6Z0fPBKhweV9JnRe-wxN6C36Sdhvg4IeGf2QFVmEr1WQpwhZ4BZt3nEonrLX2b5vH0pxvdil1NFY95vZdykaU2T4mVMvdaBwqD8jVymfAxf8RGEOOK81GYum1k43luaBw?key=zZgczEilgkhQFQm83e7rAg" alt="QR Code" style="width: 100%; height: auto; object-fit: contain;" />
      </div>
    </div>
    
    <div>
      <div style="border-left: 2px dashed #e0e0e0; padding-left: 16px;">
        <div style="color: #f5a623; font-size: clamp(1rem, 2vw, 1.1em); font-weight: bold;">Lê Hà Minh Anh</div>
        <div style="color: #f5a623; font-size: clamp(0.9rem, 1.8vw, 0.98em); font-weight: 500;">Student K21<br>Faculty of Languages - International Cultures</div>
        <div style="margin-bottom: 2px;">
          <a href="https://hoasen.edu.vn" style="color: #1976d2; text-decoration: none; word-break: break-word;"><span style="color: #1976d2;">🌐</span>https://hoasen.edu.vn</a>
        </div>
        <div style="margin-bottom: 2px;">
          <a href="https://hoasen.edu.vn" style="color: #1976d2; text-decoration: none; word-break: break-word;"><span style="color: #1976d2;">📍</span>8 Nguyen Van Trang, Ben Thanh ward, Dist. 1, HCMC</a>  
        </div>
        <div style="margin-top: 12px; border-top: 1px dotted #f5a623; padding: 8px 0; border-bottom: 1px dotted #f5a623; color: #f5a623; font-size: clamp(0.85rem, 1.7vw, 0.95em); text-align: center;">
          WORLD CLASS EDUCATION - DIVERSITY EMBRACE - ENTREPRENEURIAL SPIRIT
        </div>
      </div>
    </div>
  </div>
</div>
`;

  // Hàm chèn template vào vị trí con trỏ
  const handleInsertCardTemplate = () => {
    if (isHtmlMode) {
      // Chèn vào vị trí con trỏ trong textarea
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = content.slice(0, start);
        const after = content.slice(end);
        const newContent = before + cardTemplate + after;
        setContent(newContent);
        // Đặt lại vị trí con trỏ sau khi chèn
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + cardTemplate.length;
        }, 0);
      } else {
        setContent(content + cardTemplate);
      }
    } else {
      // Chèn vào vị trí con trỏ trong ReactQuill
      const editor = quillRef.current && quillRef.current.getEditor();
      if (editor) {
        const range = editor.getSelection(true);
        editor.clipboard.dangerouslyPasteHTML(range ? range.index : editor.getLength(), cardTemplate);
      }
    }
  };

  // Thêm ref cho signature quill
  const sigQuillRef = useRef(null);

  // Các template mẫu
  const templates = [
    {
      label: 'Thư mời hợp tác',
      value: `<p>Kính gửi [Tên đối tác],</p><p>Chúng tôi rất hân hạnh được mời Quý đối tác tham gia hợp tác cùng [Tên tổ chức] trong dự án [Tên dự án].</p><p>...</p><p>Trân trọng,<br>[Tên bạn]</p>`
    },
    {
      label: 'Thư cảm ơn',
      value: `<p>Kính gửi [Tên người nhận],</p><p>Chúng tôi xin chân thành cảm ơn Quý vị đã đồng hành cùng [Tên tổ chức] trong thời gian qua.</p><p>...</p><p>Trân trọng,<br>[Tên bạn]</p>`
    },
    {
      label: 'Thư mời sự kiện',
      value: `<p>Kính gửi [Tên khách mời],</p><p>Chúng tôi trân trọng kính mời Quý vị tham dự sự kiện [Tên sự kiện] được tổ chức vào [Thời gian] tại [Địa điểm].</p><p>...</p><p>Trân trọng,<br>[Tên bạn]</p>`
    },
    {
      label: 'Overview (có khung & hình)',
      value: `<div style="border:2px solid #1976d2; border-radius:12px; padding:24px; max-width:700px; margin:24px auto; background:#f9f9f9;">
  <div style="text-align:center; margin-bottom:20px;">
    <img src="https://upload.wikimedia.org/wikipedia/vi/2/2e/Logo_Hoa_Sen_University.png" alt="Logo" style="height:60px;" />
  </div>
  <h2 style="color:#1976d2; text-align:center; margin-bottom:16px;">THƯ MỜI HỢP TÁC</h2>
  <p>Kính gửi <b>[Tên đối tác]</b>,</p>
  <p>Chúng tôi rất hân hạnh được mời Quý đối tác tham gia hợp tác cùng <b>[Tên tổ chức]</b> trong dự án <b>[Tên dự án]</b>.</p>
  <ul style="margin:16px 0 16px 24px;">
    <li><b>Thời gian:</b> [Thời gian]</li>
    <li><b>Địa điểm:</b> [Địa điểm]</li>
    <li><b>Nội dung chính:</b> [Tóm tắt nội dung]</li>
  </ul>
  <p>Rất mong nhận được sự quan tâm và phản hồi từ Quý đối tác.</p>
  <div style="margin-top:24px; text-align:right;">
    <span style="color:#f5a623; font-weight:bold;">Trân trọng,<br>[Tên bạn]</span>
  </div>
</div>`
    }
  ];

  const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss'));

  // Cập nhật đồng hồ mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style>{customStyles}</style>
      <Box sx={styles.container}>
        <Paper sx={styles.paper}>
          {/* Header */}
          <Box sx={styles.header}>
            <Box>
              <Typography variant="h5" gutterBottom sx={styles.headerTitle}>
                <span style={{fontSize: '1.5em', marginRight: 8}}>✉️</span> Email Composer
              </Typography>
              <Typography variant="body2" sx={styles.headerDesc}>
                Create and send professional emails with our vintage editor
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={styles.clock}>{currentTime}</Box>
              <Button
                variant="outlined"
                startIcon={<Settings size={20} />}
                onClick={() => {
                  const accordion = document.getElementById('design-header');
                  if (accordion) {
                    accordion.click();
                  }
                }}
                sx={styles.templateButton}
              >
                Quick Design
              </Button>
              <IconButton
                onClick={() => setIsDarkMode((prev) => !prev)}
                sx={{ ml: 1, color: isDarkMode ? '#90caf9' : '#1976d2' }}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
              </IconButton>
            </Box>
          </Box>

          {/* Error/Success Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbar.severity}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>

          {/* Keyboard Shortcuts Help */}
          <Box sx={{ 
            position: 'absolute', 
            top: theme.spacing(2), 
            right: theme.spacing(2), 
            zIndex: 1 
          }}>
            <Tooltip title="Keyboard Shortcuts">
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  toast('⌘/Ctrl + Enter: Send email\n⌘/Ctrl + B: Toggle HTML mode', {
                    duration: 4000,
                    position: 'top-center',
                  });
                }}
              >
                ⌨️ Shortcuts
              </Button>
            </Tooltip>
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
                        <Tooltip title="Remove recipient">
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
                        </Tooltip>
                      )}
                    </Box>
                  ))}
                  <Tooltip title="Add another recipient">
                    <Button
                      startIcon={<Plus size={20} />}
                      onClick={addRecipient}
                      variant="text"
                      sx={styles.addRecipientButton}
                    >
                      Add Recipient
                    </Button>
                  </Tooltip>
                </Box>

                {/* CC Section */}
                <Box sx={styles.section}>
                  <Typography variant="subtitle1">
                    CC
                  </Typography>
                  {cc.map((email, index) => (
                    <Box key={index} sx={styles.recipientContainer}>
                      <TextField
                        fullWidth
                        size="medium"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const newCc = [...cc];
                          newCc[index] = e.target.value;
                          setCc(newCc);
                        }}
                        error={email && !validateEmail(email)}
                        helperText={email && !validateEmail(email) ? 'Invalid email format' : ''}
                        placeholder="cc@example.com"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'background.paper',
                          }
                        }}
                      />
                      {cc.length > 1 && (
                        <Tooltip title="Remove CC recipient">
                          <IconButton 
                            color="error" 
                            onClick={() => {
                              if (cc.length > 1) {
                                setCc(cc.filter((_, i) => i !== index));
                              }
                            }}
                            sx={{ 
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.error.main, 0.2),
                              }
                            }}
                          >
                            <Trash2 size={20} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  ))}
                  <Tooltip title="Add CC recipient">
                    <Button
                      startIcon={<Plus size={20} />}
                      onClick={() => setCc([...cc, ''])}
                      variant="text"
                      sx={styles.addRecipientButton}
                    >
                      Add CC
                    </Button>
                  </Tooltip>
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
                      <TextField
                        label="Line Height"
                        type="number"
                        value={parseFloat(design.lineHeight)}
                        onChange={(e) => handleDesignChange('lineHeight', e.target.value)}
                        size="small"
                        inputProps={{ 
                          min: 1,
                          max: 3,
                          step: 0.1
                        }}
                        helperText="1.0 - 3.0"
                      />
                      <TextField
                        label="Max Width"
                        type="number"
                        value={parseInt(design.maxWidth || 600)}
                        onChange={(e) => handleDesignChange('maxWidth', `${e.target.value}px`)}
                        size="small"
                        inputProps={{ min: 300, max: 1400 }}
                        helperText="px"
                      />
                      <TextField
                        label="Padding"
                        type="number"
                        value={parseInt(design.padding || 20)}
                        onChange={(e) => handleDesignChange('padding', `${e.target.value}px`)}
                        size="small"
                        inputProps={{ min: 0, max: 100 }}
                        helperText="px"
                      />
                      <TextField
                        label="Min Height"
                        type="number"
                        value={parseInt(design.minHeight || 400)}
                        onChange={e => handleDesignChange('minHeight', `${e.target.value}px`)}
                        size="small"
                        inputProps={{ min: 200, max: 1200 }}
                        helperText="px"
                      />
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Message Content */}
                <Box sx={styles.section}>
                  <Typography variant="subtitle1">
                    Message Content
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <Select
                        displayEmpty
                        value={''}
                        onChange={e => {
                          if (!isHtmlMode) {
                            toast.error('Please switch to HTML mode to insert templates');
                            return;
                          }
                          const template = templates.find(t => t.value === e.target.value);
                          if (template) {
                            setContent(template.value);
                            toast.success('Template inserted successfully');
                          }
                        }}
                        renderValue={() => 'Choose Template'}
                      >
                        <MenuItem disabled value="">
                          <em>Choose Template</em>
                        </MenuItem>
                        {templates.map((tpl, idx) => (
                          <MenuItem key={idx} value={tpl.value}>{tpl.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleToggleHtmlMode}
                      sx={styles.templateButton}
                    >
                      {isHtmlMode ? 'Switch to Editor' : 'Switch to HTML'}
                    </Button>
                  </Box>
                  {isHtmlMode && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={styles.templateButton}
                        onClick={() => setContent(formatHtml(content))}
                      >
                        Format HTML
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={styles.templateButton}
                        onClick={() => setIsHtmlFullscreen(true)}
                      >
                        Expand
                      </Button>
                    </Box>
                  )}
                  <Box sx={styles.messageContainer}>
                    {isHtmlMode ? (
                      <>
                        <textarea
                          style={{
                            width: isHtmlFullscreen ? '100vw' : '100%',
                            minHeight: isHtmlFullscreen ? '80vh' : 200,
                            fontFamily: 'monospace',
                            fontSize: 14,
                            padding: 12,
                            border: 'none',
                            outline: 'none',
                            resize: 'vertical',
                            background: '#fafafa',
                            zIndex: isHtmlFullscreen ? 1300 : 'auto',
                            position: isHtmlFullscreen ? 'fixed' : 'relative',
                            top: isHtmlFullscreen ? 0 : 'auto',
                            left: isHtmlFullscreen ? 0 : 'auto',
                            right: isHtmlFullscreen ? 0 : 'auto',
                            bottom: isHtmlFullscreen ? 0 : 'auto',
                            margin: isHtmlFullscreen ? 0 : undefined,
                          }}
                          value={content}
                          onChange={e => setContent(e.target.value)}
                          placeholder="Nhập mã HTML tại đây..."
                        />
                        {isHtmlFullscreen && (
                          <Button
                            variant="contained"
                            color="primary"
                            sx={{ position: 'fixed', top: 24, right: 32, zIndex: 1400 }}
                            onClick={() => setIsHtmlFullscreen(false)}
                          >
                            Close
                          </Button>
                        )}
                      </>
                    ) : (
                      <ReactQuill
                        ref={quillRef}
                        value={content}
                        onChange={setContent}
                        modules={modules}
                        formats={formats}
                        theme="snow"
                        placeholder="Write your message here..."
                      />
                    )}
                  </Box>
                </Box>

                {/* Attachments */}
                <Box sx={styles.section}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                    Attachments
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {attachments.map((item, index) => (
                      <Tooltip key={index} title={`${item.name} (${(item.file.size / 1024).toFixed(1)}KB)`}>
                        <Chip
                          icon={<File size={16} />}
                          label={`${item.name} (${(item.file.size / 1024).toFixed(1)}KB)`}
                          onDelete={() => removeAttachment(index)}
                          sx={styles.attachmentChip}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                  <Tooltip title="Add files to your email">
                    <Button
                      variant="outlined"
                      startIcon={<Paperclip size={20} />}
                      onClick={() => attachmentInputRef.current?.click()}
                      size="small"
                    >
                      Add Attachments
                    </Button>
                  </Tooltip>
                  <input
                    type="file"
                    ref={attachmentInputRef}
                    hidden
                    multiple
                    onChange={handleFileAttachment}
                  />
                </Box>

                {/* Signature Content */}
                <Box sx={styles.section}>
                  <Typography variant="subtitle1">
                    Signature
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setIsSignatureHtmlMode((prev) => !prev)}
                      sx={styles.templateButton}
                    >
                      {isSignatureHtmlMode ? 'Switch to Editor' : 'Switch to HTML'}
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      color="secondary"
                      onClick={() => {
                        if (!isSignatureHtmlMode) {
                          toast.error('Please switch to HTML mode to insert card template');
                          return;
                        }
                        // Chèn vào vị trí con trỏ trong textarea signature
                        const textarea = document.getElementById('signature-html-textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const before = signature.slice(0, start);
                          const after = signature.slice(end);
                          const newContent = before + cardTemplate + after;
                          setSignature(newContent);
                          setTimeout(() => {
                            textarea.focus();
                            textarea.selectionStart = textarea.selectionEnd = start + cardTemplate.length;
                          }, 0);
                        } else {
                          setSignature(signature + cardTemplate);
                        }
                      }}
                      sx={styles.templateButton}
                    >
                      Insert Card Template
                    </Button>
                  </Box>
                  {isSignatureHtmlMode && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={styles.templateButton}
                        onClick={() => setSignature(formatHtml(signature))}
                      >
                        Format HTML
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={styles.templateButton}
                        onClick={() => setIsSignatureHtmlFullscreen(true)}
                      >
                        Expand
                      </Button>
                    </Box>
                  )}
                  {isSignatureHtmlMode ? (
                    <>
                      <textarea
                        id="signature-html-textarea"
                        style={{
                          width: isSignatureHtmlFullscreen ? '100vw' : '100%',
                          minHeight: isSignatureHtmlFullscreen ? '80vh' : 220,
                          fontFamily: 'monospace',
                          fontSize: 14,
                          padding: 16,
                          border: '1px solid #e0e0e0',
                          borderRadius: 8,
                          background: '#fafafa',
                          marginTop: 8,
                          zIndex: isSignatureHtmlFullscreen ? 1300 : 'auto',
                          position: isSignatureHtmlFullscreen ? 'fixed' : 'relative',
                          top: isSignatureHtmlFullscreen ? 0 : 'auto',
                          left: isSignatureHtmlFullscreen ? 0 : 'auto',
                          right: isSignatureHtmlFullscreen ? 0 : 'auto',
                          bottom: isSignatureHtmlFullscreen ? 0 : 'auto',
                        }}
                        value={signature}
                        onChange={e => setSignature(e.target.value)}
                        placeholder="Enter signature HTML here..."
                      />
                      {isSignatureHtmlFullscreen && (
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ position: 'fixed', top: 24, right: 32, zIndex: 1400 }}
                          onClick={() => setIsSignatureHtmlFullscreen(false)}
                        >
                          Close
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="signature-quill">
                      <ReactQuill
                        ref={sigQuillRef}
                        value={signature}
                        onChange={setSignature}
                        modules={modules}
                        formats={formats}
                        theme="snow"
                        placeholder="Enter signature here..."
                        style={{ minHeight: 220, marginTop: 8, background: '#fafafa', borderRadius: 8, padding: 8 }}
                      />
                    </div>
                  )}
                </Box>

                {/* Send Button */}
                <Tooltip title={!subject || !content ? "Please fill in all required fields" : "Send your email"}>
                  <span>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={loading ? null : <Send size={20} />}
                      onClick={handleSubmit}
                      disabled={loading || !subject || !content}
                      sx={styles.sendButton}
                    >
                      {loading ? 'Sending...' : 'Send Email'}
                    </Button>
                  </span>
                </Tooltip>
              </Box>

              {/* Right side - Live Preview */}
              <Box sx={styles.rightSide}>
                <Box sx={styles.previewContainer}>
                  <Typography variant="subtitle1" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between' 
                  }}>
                    <span>Live Preview</span>
                    <Tooltip title="Preview in new tab">
                      <IconButton
                        size="small"
                        onClick={() => {
                          const previewWindow = window.open('', '_blank');
                          previewWindow.document.write(`
                            <html>
                              <head>
                                <title>Email Preview</title>
                                <style>
                                  body { 
                                    font-family: ${design.fontFamily};
                                    line-height: ${design.lineHeight};
                                    margin: 0;
                                    padding: 20px;
                                    background: #f5f5f5;
                                  }
                                  .email-container {
                                    max-width: ${design.maxWidth};
                                    margin: 0 auto;
                                    background: ${design.backgroundColor};
                                    padding: ${design.padding};
                                    border: ${design.borderWidth} ${design.borderStyle} ${design.borderColor};
                                    border-radius: ${design.borderRadius};
                                  }
                                  .signature-container {
                                    margin-top: 20px;
                                    padding-top: 20px;
                                    border-top: 1px solid #e0e0e0;
                                  }
                                  img { max-width: 100%; height: auto; }
                                </style>
                              </head>
                              <body>
                                <div class="email-container">
                                  ${content}
                                  <div class="signature-container">
                                    ${signature}
                                  </div>
                                </div>
                                <div style="margin-top: 20px; text-align: center; color: #666;">
                                  <small>This is a preview of how your email will look.</small>
                                </div>
                              </body>
                            </html>
                          `);
                        }}
                      >
                        <ExternalLink size={16} />
                      </IconButton>
                    </Tooltip>
                  </Typography>
                  
                  <Paper sx={{ 
                    p: 2, 
                    mb: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                    }
                  }}>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      <strong>To:</strong> {recipients.filter(validateEmail).join(', ')}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      <strong>Subject:</strong> {subject}
                    </Typography>
                    {cc.filter(email => email.trim() !== '').length > 0 && (
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        <strong>CC:</strong> {cc.filter(validateEmail).join(', ')}
                      </Typography>
                    )}
                    {attachments.length > 0 && (
                      <Typography variant="body2">
                        <strong>Attachments:</strong> {attachments.length} files
                      </Typography>
                    )}
                  </Paper>

                  {/* Main Content with Signature */}
                  <Box sx={{
                    backgroundColor: design.backgroundColor,
                    padding: design.padding,
                    border: `${design.borderWidth} ${design.borderStyle} ${design.borderColor}`,
                    borderRadius: design.borderRadius,
                    minHeight: design.minHeight || '400px',
                    fontFamily: design.fontFamily,
                    lineHeight: design.lineHeight,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                    },
                    '& img': {
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: '4px',
                    },
                  }}>
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                    <Box sx={{
                      mt: 3,
                      pt: 3,
                      borderTop: '1px solid #e0e0e0',
                      backgroundColor: '#fff',
                    }}>
                      <div dangerouslySetInnerHTML={{ __html: signature }} />
                    </Box>
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