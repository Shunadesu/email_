import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Trash2, Image, Users } from 'lucide-react';

const MultiEmailSender = () => {
  const [recipients, setRecipients] = useState([{ email: '', valid: false }]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState([]);
  const [embedImages, setEmbedImages] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  
  const editorRef = useRef(null);
  
  // Initialize the editor content when message changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = message;
      // Apply initial styles
      applyEditorStyles(editorRef.current);
    }
  }, []);

  const applyEditorStyles = (element) => {
    // Apply styles to the element and all its children
    const applyStyles = (el) => {
      if (el.nodeType === 1) { // Element node
        el.style.writingMode = 'horizontal-tb';
        el.style.direction = 'ltr';
        el.style.textOrientation = 'mixed';
        el.style.textAlign = 'left';
        el.style.transform = 'scale(1, 1)';
        
        // Apply to all children
        Array.from(el.children).forEach(applyStyles);
      }
    };
    applyStyles(element);
  };
  
  const sanitizeHtml = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Apply styles to ensure correct text direction
    applyEditorStyles(tempDiv);
    
    return tempDiv.innerHTML;
  };
  
  // Update message state when editor content changes
  const handleEditorChange = () => {
    if (editorRef.current) {
      const sanitizedHtml = sanitizeHtml(editorRef.current.innerHTML);
      setMessage(sanitizedHtml);
      
      // Preserve cursor position
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      
      // Update content
      editorRef.current.innerHTML = sanitizedHtml;
      
      // Reapply styles
      applyEditorStyles(editorRef.current);
      
      // Restore cursor position
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };
  
  // Formatting functions
  const execFormatCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleEditorChange();
  };

  // Validate email format
  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  // Handle recipient email changes
  const handleEmailChange = (index, value) => {
    const newRecipients = [...recipients];
    newRecipients[index] = {
      email: value,
      valid: validateEmail(value)
    };
    setRecipients(newRecipients);
  };

  // Add new recipient field
  const addRecipient = () => {
    setRecipients([...recipients, { email: '', valid: false }]);
  };

  // Remove recipient
  const removeRecipient = (index) => {
    if (recipients.length > 1) {
      const newRecipients = [...recipients];
      newRecipients.splice(index, 1);
      setRecipients(newRecipients);
    }
  };

  // Handle image selection
  const handleImageSelection = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      name: file.name,
      size: Math.round(file.size / 1024), // Convert to KB
      file: file, // Store the actual file object for upload
      previewUrl: URL.createObjectURL(file) // Generate a preview URL
    }));
    
    setImages([...images, ...newImages]);
  };

  // Remove image
  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Actually send emails
  const sendEmails = async () => {
    // Validate all inputs
    const validRecipients = recipients.filter(r => r.valid);
    if (validRecipients.length === 0 || !subject || !message) {
      alert('Please fill in all required fields and ensure you have valid email addresses.');
      return;
    }

    setSending(true);
    
    try {
      // Create form data for file uploads
      const formData = new FormData();
      
      // Add recipient emails
      validRecipients.forEach(recipient => {
        formData.append('recipients', recipient.email);
      });
      
      // Add subject and message
      formData.append('subject', subject);
      formData.append('message', message); // This now contains HTML from the rich text editor
      
      // Add image files
      images.forEach(img => {
        if (img.file) {
          formData.append('image', img.file);
        }
      });

      // Add embedImages preference
      formData.append('embedImages', embedImages.toString());
      formData.append('htmlFormat', 'true'); // Always send as HTML since we're using a rich text editor
      
      // Send the request to your backend
      const response = await fetch('http://localhost:5000/api/send-emails', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header here as the browser will set it with the boundary parameter for FormData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send emails');
      }
      
      // Success
      setSent(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setRecipients([{ email: '', valid: false }]);
        setSubject('');
        setMessage('');
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
        setImages([]);
        setSent(false);
      }, 3000);
    } catch (error) {
      alert(`Error sending emails: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  // Get button state
  const isFormValid = () => {
    return recipients.some(r => r.valid) && subject && message;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Multi Email Sender</h1>
      
      {/* Recipients Section */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Users className="mr-2 text-gray-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-700">Recipients</h2>
        </div>
        
        <div className="space-y-2">
          {recipients.map((recipient, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="email"
                value={recipient.email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                placeholder="recipient@example.com"
                className={`flex-1 p-2 border rounded-md ${
                  recipient.email && !recipient.valid ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {recipients.length > 1 && (
                <button
                  onClick={() => removeRecipient(index)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-md"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <button
          onClick={addRecipient}
          className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
        >
          <Plus size={16} className="mr-1" /> Add another recipient
        </button>
      </div>
      
      {/* Email Content */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter email subject"
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">Message</label>
        
        {/* Simple Rich Text Editor Toolbar */}
        <div className="flex flex-wrap items-center border border-gray-300 border-b-0 rounded-t-md p-1 bg-gray-50">
          {/* Text Style */}
          <select 
            onChange={(e) => execFormatCommand('formatBlock', e.target.value)}
            className="px-2 py-1 mr-1 border border-gray-300 rounded text-sm"
          >
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="pre">Preformatted</option>
          </select>
          
          {/* Font Family */}
          <select 
            onChange={(e) => execFormatCommand('fontName', e.target.value)}
            className="px-2 py-1 mr-1 border border-gray-300 rounded text-sm"
          >
            <option value="Arial, sans-serif">Arial</option>
            <option value="Verdana, sans-serif">Verdana</option>
            <option value="Helvetica, sans-serif">Helvetica</option>
            <option value="Times New Roman, serif">Times New Roman</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Courier New, monospace">Courier New</option>
          </select>
          
          {/* Font Size */}
          <select 
            onChange={(e) => execFormatCommand('fontSize', e.target.value)}
            className="px-2 py-1 mr-1 border border-gray-300 rounded text-sm"
          >
            <option value="1">Small</option>
            <option value="3">Normal</option>
            <option value="5">Large</option>
            <option value="7">Huge</option>
          </select>
          
          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          
          {/* Bold, Italic, Underline */}
          <button 
            onClick={() => execFormatCommand('bold')}
            className="px-2 py-1 mr-1 border border-gray-300 rounded font-bold"
            title="Bold"
          >
            B
          </button>
          <button 
            onClick={() => execFormatCommand('italic')}
            className="px-2 py-1 mr-1 border border-gray-300 rounded italic"
            title="Italic"
          >
            I
          </button>
          <button 
            onClick={() => execFormatCommand('underline')}
            className="px-2 py-1 mr-1 border border-gray-300 rounded underline"
            title="Underline"
          >
            U
          </button>
          
          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          
          {/* Text Color */}
          <div className="relative mr-1">
            <input 
              type="color" 
              onChange={(e) => execFormatCommand('foreColor', e.target.value)}
              className="w-8 h-8 cursor-pointer rounded border border-gray-300"
              title="Text Color"
            />
            <label className="text-xs text-gray-600 absolute -bottom-4 left-0">Color</label>
          </div>
          
          {/* Background Color */}
          <div className="relative mr-1">
            <input 
              type="color" 
              onChange={(e) => execFormatCommand('hiliteColor', e.target.value)}
              className="w-8 h-8 cursor-pointer rounded border border-gray-300"
              title="Background Color"
            />
            <label className="text-xs text-gray-600 absolute -bottom-4 left-0">BG</label>
          </div>
          
          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          
          {/* Alignment */}
          <button 
            onClick={() => execFormatCommand('justifyLeft')}
            className="px-2 py-1 mr-1 border border-gray-300 rounded"
            title="Align Left"
          >
            <span className="block w-4 border-t border-gray-800 my-1"></span>
            <span className="block w-6 border-t border-gray-800 my-1"></span>
            <span className="block w-3 border-t border-gray-800 my-1"></span>
          </button>
          <button 
            onClick={() => execFormatCommand('justifyCenter')}
            className="px-2 py-1 mr-1 border border-gray-300 rounded"
            title="Align Center"
          >
            <span className="block w-6 border-t border-gray-800 my-1 mx-auto"></span>
            <span className="block w-6 border-t border-gray-800 my-1 mx-auto"></span>
            <span className="block w-6 border-t border-gray-800 my-1 mx-auto"></span>
          </button>
          <button 
            onClick={() => execFormatCommand('justifyRight')}
            className="px-2 py-1 mr-1 border border-gray-300 rounded"
            title="Align Right"
          >
            <span className="block w-4 border-t border-gray-800 my-1 ml-auto"></span>
            <span className="block w-6 border-t border-gray-800 my-1 ml-auto"></span>
            <span className="block w-3 border-t border-gray-800 my-1 ml-auto"></span>
          </button>
          
          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          
          {/* Lists */}
          <button 
            onClick={() => execFormatCommand('insertUnorderedList')}
            className="px-2 py-1 mr-1 border border-gray-300 rounded"
            title="Bullet List"
          >
            • List
          </button>
          <button 
            onClick={() => execFormatCommand('insertOrderedList')}
            className="px-2 py-1 mr-1 border border-gray-300 rounded"
            title="Numbered List"
          >
            1. List
          </button>
          
          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          
          {/* Insert Link */}
          <button 
            onClick={() => {
              const url = prompt('Enter the URL:');
              if (url) execFormatCommand('createLink', url);
            }}
            className="px-2 py-1 mr-1 border border-gray-300 rounded"
            title="Insert Link"
          >
            Link
          </button>
          
          {/* Clear Formatting */}
          <button 
            onClick={() => execFormatCommand('removeFormat')}
            className="px-2 py-1 mr-1 border border-gray-300 rounded"
            title="Clear Formatting"
          >
            Clear
          </button>
        </div>
        
        {/* Editable Content Area */}
        <div 
          ref={editorRef}
          contentEditable
          className="min-h-[200px] max-h-[500px] overflow-y-auto p-3 border border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onInput={handleEditorChange}
          onBlur={handleEditorChange}
          style={{
            writingMode: 'horizontal-tb',
            direction: 'ltr',
            textOrientation: 'mixed',
            textAlign: 'left',
            transform: 'scale(1, 1)'
          }}
          dangerouslySetInnerHTML={{ __html: message }}
        />
        
        <p className="text-xs text-gray-500 mt-2">
          Use the toolbar above to format your message with colors, fonts, and styles.
        </p>
      </div>
      
      {/* Image Attachments */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Image className="mr-2 text-gray-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-700">Image Attachments</h2>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="embedImages"
              checked={embedImages}
              onChange={(e) => setEmbedImages(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="embedImages" className="ml-2 text-sm text-gray-700">
              Embed images in message body
            </label>
          </div>
        </div>
        
        {/* Image preview area */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <div className="aspect-video relative overflow-hidden rounded-md border border-gray-300 bg-gray-100">
                  <img 
                    src={img.previewUrl} 
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
                  <button 
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-xs mt-1 truncate">{img.name} ({img.size} KB)</p>
              </div>
            ))}
          </div>
        )}
        
        {/* File input */}
        <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelection}
            className="hidden"
          />
          <div className="flex flex-col items-center">
            <Image className="mb-2 text-gray-500" size={28} />
            <span className="text-sm text-gray-600">Click to add images</span>
            <span className="text-xs text-gray-400">JPG, PNG, GIF up to 5MB</span>
          </div>
        </label>
      </div>
      
      {/* Send Button */}
      <div className="flex justify-end">
        <button
          onClick={sendEmails}
          disabled={!isFormValid() || sending || sent}
          className={`flex items-center px-6 py-3 rounded-md transition-colors ${
            isFormValid() && !sending && !sent
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {sending ? (
            <>
              <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Sending...
            </>
          ) : sent ? (
            'Sent ✓'
          ) : (
            <>
              <Send size={18} className="mr-2" />
              Send Emails
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MultiEmailSender;