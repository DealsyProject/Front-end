import React, { useRef, useReducer, useEffect, useCallback, useState } from "react";
import emailjs from "@emailjs/browser";
import { motion, AnimatePresence } from "framer-motion";

// --- Constants & Configuration ---
const STYLES = {
  MODERN: "modern",
  CLASSIC: "classic", 
  DARK: "dark",
  MINIMAL: "minimal"
};

const THEME_CONFIG = {
  [STYLES.MODERN]: {
    primary: "#586330",
    secondary: "#6b7a38",
    accent: "#FF6B35",
    bg: "from-[#f7fee7] to-[#e8f5d8]",
    card: "bg-white",
    text: "text-gray-900",
    border: "border-gray-200"
  },
  [STYLES.CLASSIC]: {
    primary: "#2563eb",
    secondary: "#1d4ed8",
    accent: "#f59e0b",
    bg: "from-blue-50 to-indigo-50",
    card: "bg-white",
    text: "text-gray-800",
    border: "border-gray-300"
  },
  [STYLES.DARK]: {
    primary: "#8b5cf6",
    secondary: "#7c3aed",
    accent: "#10b981",
    bg: "from-gray-900 to-gray-800",
    card: "bg-gray-800",
    text: "text-gray-100",
    border: "border-gray-700"
  },
  [STYLES.MINIMAL]: {
    primary: "#000000",
    secondary: "#333333",
    accent: "#666666",
    bg: "from-white to-gray-50",
    card: "bg-white border",
    text: "text-gray-900",
    border: "border-gray-300"
  }
};

// --- Reducer Setup with Enhanced State ---
const initialFormState = {
  // Form Data
  name: localStorage.getItem('emailDraft_name') || '',
  email: localStorage.getItem('emailDraft_email') || '',
  subject: localStorage.getItem('emailDraft_subject') || '',
  message: localStorage.getItem('emailDraft_message') || '',
  priority: localStorage.getItem('emailDraft_priority') || 'normal',
  category: localStorage.getItem('emailDraft_category') || 'general',
  attachments: JSON.parse(localStorage.getItem('emailDraft_attachments')) || [],
  
  // UI State
  isLoading: false,
  isSent: false,
  errors: {},
  isTyping: false,
  wordCount: 0,
  suggestions: []
};

function formReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return { 
        ...state, 
        [action.field]: action.value, 
        errors: { ...state.errors, [action.field]: null },
        wordCount: action.field === 'message' ? action.value.split(/\s+/).filter(Boolean).length : state.wordCount
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SET_SENT':
      return { ...state, isSent: action.isSent };
    case 'RESET_FORM':
      return { ...initialFormState, attachments: [] };
    case 'SET_TYPING':
      return { ...state, isTyping: action.isTyping };
    case 'ADD_ATTACHMENT':
      return { 
        ...state, 
        attachments: [...state.attachments, ...action.files],
        errors: { ...state.errors, attachments: null }
      };
    case 'REMOVE_ATTACHMENT':
      return {
        ...state,
        attachments: state.attachments.filter((_, i) => i !== action.index)
      };
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.suggestions };
    case 'APPLY_SUGGESTION':
      return { 
        ...state, 
        message: action.suggestion,
        suggestions: []
      };
    default:
      return state;
  }
}

// --- Advanced Email Support Component ---
export default function AdvancedEmailSupport({ setCurrentView }) {
  const formRef = useRef();
  const fileInputRef = useRef();
  const messageRef = useRef();
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const [selectedStyle, setSelectedStyle] = useState(STYLES.MODERN);
  const [characterCount, setCharacterCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const { 
    name, email, subject, message, priority, category, attachments,
    isLoading, isSent, errors, wordCount, suggestions 
  } = state;
  
  const theme = THEME_CONFIG[selectedStyle];

  // --- Advanced Features ---

  // 1. Intelligent Auto-Save with Draft Management
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isDirty && (name || email || subject || message)) {
        const draft = {
          name, email, subject, message, priority, category,
          attachments: attachments.map(a => ({ name: a.name, size: a.size })),
          lastSaved: new Date().toISOString()
        };
        localStorage.setItem('emailDraft_full', JSON.stringify(draft));
        localStorage.setItem('emailDraft_timestamp', new Date().toLocaleString());
        
        // Show toast notification
        showToast('Draft saved automatically', 'success');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [name, email, subject, message, priority, category, attachments, isDirty]);

  // 2. Load Saved Draft
  const loadSavedDraft = useCallback(() => {
    const saved = localStorage.getItem('emailDraft_full');
    if (saved) {
      const draft = JSON.parse(saved);
      dispatch({ type: 'UPDATE_FIELD', field: 'name', value: draft.name });
      dispatch({ type: 'UPDATE_FIELD', field: 'email', value: draft.email });
      dispatch({ type: 'UPDATE_FIELD', field: 'subject', value: draft.subject });
      dispatch({ type: 'UPDATE_FIELD', field: 'message', value: draft.message });
      dispatch({ type: 'UPDATE_FIELD', field: 'priority', value: draft.priority });
      dispatch({ type: 'UPDATE_FIELD', field: 'category', value: draft.category });
      showToast('Draft loaded successfully', 'info');
    }
  }, []);

  // 3. AI-Powered Message Suggestions
  const getAISuggestions = useCallback(async (text) => {
    if (text.length < 10) return;
    
    // Simulate AI suggestions (in real app, call an API)
    setTimeout(() => {
      const mockSuggestions = [
        `I'm writing regarding: ${text.substring(0, 50)}...`,
        `I need assistance with: ${subject || 'the mentioned issue'}. More details: ${text}`,
        `Can you help me with: ${text.split(' ').slice(0, 10).join(' ')}...?`
      ];
      dispatch({ type: 'SET_SUGGESTIONS', suggestions: mockSuggestions });
    }, 1000);
  }, [subject]);

  // 4. Advanced Validation with Multiple Rules
  const validateField = (field, value) => {
    const rules = {
      name: [
        { test: () => !value.trim(), message: "Name is required" },
        { test: () => value.trim().length < 2, message: "Name must be at least 2 characters" },
        { test: () => !/^[a-zA-Z\s]*$/.test(value), message: "Name can only contain letters and spaces" }
      ],
      email: [
        { test: () => !value.trim(), message: "Email is required" },
        { test: () => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), message: "Please enter a valid email address" },
        { test: () => !/^[^\s@]+@(gmail|yahoo|outlook|hotmail|icloud)\./.test(value.toLowerCase()), 
          message: "Please use a recognized email provider", warning: true }
      ],
      subject: [
        { test: () => !value.trim(), message: "Subject is required" },
        { test: () => value.trim().length < 5, message: "Subject must be at least 5 characters" },
        { test: () => value.trim().length > 100, message: "Subject is too long (max 100 characters)" }
      ],
      message: [
        { test: () => !value.trim(), message: "Message is required" },
        { test: () => value.trim().length < 20, message: "Please provide more details (min 20 characters)" },
        { test: () => wordCount > 1000, message: "Message is too long (max 1000 words)" }
      ]
    };

    const fieldRules = rules[field] || [];
    for (const rule of fieldRules) {
      if (rule.test()) {
        return { message: rule.message, isWarning: rule.warning || false };
      }
    }
    return null;
  };

  // 5. File Attachment Handler
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/', 'application/pdf', 'text/', 'application/msword'];

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        showToast(`${file.name} exceeds 10MB limit`, 'error');
        return false;
      }
      if (!allowedTypes.some(type => file.type.startsWith(type))) {
        showToast(`${file.name} has invalid file type`, 'error');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      dispatch({ type: 'ADD_ATTACHMENT', files: validFiles });
      showToast(`${validFiles.length} file(s) added`, 'success');
    }
  };

  // 6. Email Sending with Enhanced Error Handling
  const sendEmail = async (e) => {
    e.preventDefault();
    setIsDirty(false);

    // Validate all fields
    const newErrors = {};
    ['name', 'email', 'subject', 'message'].forEach(field => {
      const error = validateField(field, state[field]);
      if (error) newErrors[field] = error;
    });

    if (attachments.length > 5) {
      newErrors.attachments = { message: "Maximum 5 attachments allowed", isWarning: false };
    }

    if (Object.keys(newErrors).length > 0) {
      dispatch({ type: 'SET_ERRORS', errors: newErrors });
      return;
    }

    dispatch({ type: 'SET_LOADING', isLoading: true });

    try {
      // Prepare form data with attachments
      const formData = new FormData();
      formData.append('from_name', name);
      formData.append('from_email', email);
      formData.append('subject', subject);
      formData.append('message', message);
      formData.append('priority', priority);
      formData.append('category', category);
      formData.append('timestamp', new Date().toISOString());
      
      // Add attachments
      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      // Send via EmailJS (or your own backend)
      const result = await emailjs.send(
        "service_fnftav9",
        "template_3lyfhpj",
        {
          from_name: name,
          from_email: email,
          subject: `${priority.toUpperCase()}: ${subject}`,
          message: message,
          category: category,
          attachments_count: attachments.length
        },
        "dykdlfyKOa-08cpCY"
      );

      // Clear all drafts
      clearDrafts();
      
      dispatch({ type: 'SET_LOADING', isLoading: false });
      dispatch({ type: 'SET_SENT', isSent: true });

      // Track analytics
      logSupportRequest({
        type: 'email',
        category,
        priority,
        hasAttachments: attachments.length > 0,
        wordCount
      });

    } catch (error) {
      console.error("Email failed:", error);
      dispatch({ type: 'SET_LOADING', isLoading: false });
      
      // Advanced error handling
      if (error.text?.includes('quota')) {
        showToast('Daily email limit reached. Please try again tomorrow or use live chat.', 'error');
      } else if (error.text?.includes('invalid')) {
        showToast('Invalid email configuration. Please check your email address.', 'error');
      } else {
        showToast('Failed to send message. Please try again or use Live Chat.', 'error');
      }
    }
  };

  // --- UI Helper Components ---

  const StyleSelector = () => (
    <div className="absolute top-4 right-4 z-10">
      <select 
        value={selectedStyle}
        onChange={(e) => setSelectedStyle(e.target.value)}
        className={`px-3 py-1 rounded-full text-sm font-medium border ${theme.border} bg-white/90 backdrop-blur-sm`}
      >
        <option value={STYLES.MODERN}>Modern</option>
        <option value={STYLES.CLASSIC}>Classic</option>
        <option value={STYLES.DARK}>Dark</option>
        <option value={STYLES.MINIMAL}>Minimal</option>
      </select>
    </div>
  );

  const AttachmentList = () => (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Attachments ({attachments.length}/5)</span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm px-3 py-1 rounded-lg border border-dashed hover:bg-gray-50"
        >
          + Add Files
        </button>
      </div>
      <div className="space-y-2">
        {attachments.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm truncate max-w-[200px]">{file.name}</span>
              <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: 'REMOVE_ATTACHMENT', index })}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const AISuggestions = () => (
    <AnimatePresence>
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <h4 className="font-medium text-blue-800 mb-2">AI Suggestions</h4>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => dispatch({ type: 'APPLY_SUGGESTION', suggestion })}
                className="w-full text-left p-2 hover:bg-blue-100 rounded text-sm text-blue-700"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const WritingStats = () => (
    <div className="flex justify-between text-sm text-gray-500 mt-2">
      <span>{wordCount} words</span>
      <span>{characterCount}/5000 characters</span>
      <span className={wordCount > 1000 ? "text-red-500" : ""}>
        {Math.ceil(wordCount / 200)} min read
      </span>
    </div>
  );

  // --- Main Render ---

  if (isSent) {
    return <SuccessScreen theme={theme} setCurrentView={setCurrentView} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen bg-gradient-to-br ${theme.bg} py-8 px-4 transition-colors duration-300`}
    >
      <StyleSelector />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className={`inline-flex items-center justify-center w-24 h-24 ${theme.card} rounded-3xl shadow-2xl mb-6 border ${theme.border}`}>
            <svg className="w-14 h-14" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className={`text-5xl font-bold bg-gradient-to-r from-gray-900 to-[${theme.primary}] bg-clip-text text-transparent mb-4`}>
            Advanced Support
          </h1>
          <p className={`text-xl ${theme.text} opacity-80 max-w-2xl mx-auto`}>
            Get expert help with our multi-channel support system
          </p>
          
          {/* Draft Status */}
          {isDirty && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm"
            >
              <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
              </svg>
              Auto-saving draft...
            </motion.div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className={`${theme.card} rounded-3xl shadow-2xl p-8 lg:p-10 border ${theme.border}`}>
              <form ref={formRef} onSubmit={sendEmail} className="space-y-8">
                {/* Priority & Category */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold mb-2">Priority Level</label>
                    <select
                      name="priority"
                      value={priority}
                      onChange={(e) => {
                        dispatch({ type: 'UPDATE_FIELD', field: 'priority', value: e.target.value });
                        setIsDirty(true);
                      }}
                      className={`w-full px-4 py-3 rounded-2xl border-2 ${theme.border} focus:outline-none focus:ring-2`}
                      style={{ borderColor: theme.primary }}
                    >
                      <option value="low">Low Priority</option>
                      <option value="normal">Normal</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent (24/7)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block font-semibold mb-2">Category</label>
                    <select
                      name="category"
                      value={category}
                      onChange={(e) => {
                        dispatch({ type: 'UPDATE_FIELD', field: 'category', value: e.target.value });
                        setIsDirty(true);
                      }}
                      className={`w-full px-4 py-3 rounded-2xl border-2 ${theme.border} focus:outline-none focus:ring-2`}
                      style={{ borderColor: theme.primary }}
                    >
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="feature">Feature Request</option>
                      <option value="bug">Bug Report</option>
                      <option value="security">Security Issue</option>
                    </select>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={name}
                      onChange={(e) => {
                        dispatch({ type: 'UPDATE_FIELD', field: 'name', value: e.target.value });
                        setIsDirty(true);
                      }}
                      className={`w-full px-5 py-4 rounded-2xl border-2 transition-all ${
                        errors.name ? "border-red-500" : `${theme.border}`
                      }`}
                      placeholder="Your Name"
                    />
                    {errors.name && (
                      <p className={`text-sm mt-2 ${errors.name.isWarning ? 'text-yellow-600' : 'text-red-500'}`}>
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => {
                        dispatch({ type: 'UPDATE_FIELD', field: 'email', value: e.target.value });
                        setIsDirty(true);
                      }}
                      className={`w-full px-5 py-4 rounded-2xl border-2 transition-all ${
                        errors.email ? "border-red-500" : `${theme.border}`
                      }`}
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className={`text-sm mt-2 ${errors.email.isWarning ? 'text-yellow-600' : 'text-red-500'}`}>
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block font-semibold mb-2">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={subject}
                    onChange={(e) => {
                      dispatch({ type: 'UPDATE_FIELD', field: 'subject', value: e.target.value });
                      setIsDirty(true);
                    }}
                    className={`w-full px-5 py-4 rounded-2xl border-2 transition-all ${
                      errors.subject ? "border-red-500" : `${theme.border}`
                    }`}
                    placeholder="Brief description of your issue"
                  />
                  {errors.subject && (
                    <p className="text-sm text-red-500 mt-2">{errors.subject.message}</p>
                  )}
                </div>

                {/* Message with AI Assist */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-semibold">Detailed Message *</label>
                    <button
                      type="button"
                      onClick={() => getAISuggestions(message)}
                      className="text-sm px-3 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      Get AI Suggestions
                    </button>
                  </div>
                  <textarea
                    ref={messageRef}
                    name="message"
                    rows="10"
                    value={message}
                    onChange={(e) => {
                      dispatch({ type: 'UPDATE_FIELD', field: 'message', value: e.target.value });
                      setCharacterCount(e.target.value.length);
                      setIsDirty(true);
                    }}
                    onFocus={() => dispatch({ type: 'SET_TYPING', isTyping: true })}
                    onBlur={() => dispatch({ type: 'SET_TYPING', isTyping: false })}
                    className={`w-full px-5 py-4 rounded-2xl border-2 transition-all resize-none ${
                      errors.message ? "border-red-500" : `${theme.border}`
                    }`}
                    placeholder="Describe your issue in detail. Include error messages, steps to reproduce, and what you've tried..."
                  />
                  <WritingStats />
                  {errors.message && (
                    <p className="text-sm text-red-500 mt-2">{errors.message.message}</p>
                  )}
                  <AISuggestions />
                </div>

                {/* File Attachments */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                  />
                  <AttachmentList />
                  {errors.attachments && (
                    <p className="text-sm text-red-500 mt-2">{errors.attachments.message}</p>
                  )}
                </div>

                {/* Submit Section */}
                <div className="pt-8 border-t">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={loadSavedDraft}
                        className="px-6 py-3 border rounded-2xl font-medium hover:bg-gray-50"
                      >
                        Load Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          dispatch({ type: 'RESET_FORM' });
                          setIsDirty(false);
                        }}
                        className="px-6 py-3 border border-red-300 text-red-600 rounded-2xl font-medium hover:bg-red-50"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-10 py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center gap-3"
                      style={{ 
                        backgroundColor: theme.primary,
                        color: 'white'
                      }}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    By submitting, you agree to our privacy policy and allow us to contact you regarding this issue.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar with Enhanced Features */}
          <div className="space-y-6">
            {/* Quick Actions Panel */}
            <div className={`${theme.card} rounded-3xl shadow-2xl p-8 border ${theme.border}`}>
              <h3 className="text-2xl font-bold mb-6">Quick Actions</h3>
              <div className="space-y-4">
                <ActionButton
                  icon="💬"
                  label="Live Chat"
                  description="Instant response"
                  onClick={() => setCurrentView('chat')}
                  color={theme.primary}
                />
                <ActionButton
                  icon="📞"
                  label="Call Us"
                  description="24/7 support"
                  onClick={() => window.open('tel:+17012734448')}
                  color={theme.secondary}
                />
                <ActionButton
                  icon="📚"
                  label="Knowledge Base"
                  description="Self-help articles"
                  onClick={() => setCurrentView('faq')}
                  color={theme.accent}
                />
                <ActionButton
                  icon="🎥"
                  label="Video Guides"
                  description="Step-by-step tutorials"
                  onClick={() => window.open('https://www.youtube.com/c/YourChannel')}
                  color="#8b5cf6"
                />
              </div>
            </div>

            {/* Stats & Analytics */}
            <div className={`rounded-3xl shadow-2xl p-8 text-white`} style={{ backgroundColor: theme.primary }}>
              <h4 className="text-xl font-bold mb-6">Support Analytics</h4>
              <div className="space-y-4">
                <StatItem label="Avg Response Time" value="< 47 min" />
                <StatItem label="Satisfaction Rate" value="98.7%" />
                <StatItem label="First Contact Resolution" value="92%" />
                <StatItem label="Active Cases" value="24" />
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between text-sm">
                  <span>Your Ticket ID:</span>
                  <span className="font-mono font-bold">#{Date.now().toString(36).toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Preview Toggle */}
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`w-full ${theme.card} rounded-3xl shadow-lg p-6 border ${theme.border} text-left hover:shadow-xl transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold mb-1">Preview Message</h4>
                  <p className="text-sm opacity-70">See how your message will appear</p>
                </div>
                <svg className={`w-6 h-6 transition-transform ${showPreview ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Message Preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-8 ${theme.card} rounded-3xl shadow-xl p-8 border ${theme.border} overflow-hidden`}
            >
              <h3 className="text-2xl font-bold mb-6">Message Preview</h3>
              <div className="space-y-4">
                <PreviewField label="From" value={`${name} <${email}>`} />
                <PreviewField label="Subject" value={subject} />
                <PreviewField label="Priority" value={priority.toUpperCase()} />
                <PreviewField label="Category" value={category} />
                <div>
                  <label className="block font-medium mb-2">Message:</label>
                  <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap min-h-[200px]">
                    {message || <span className="opacity-50">Your message will appear here...</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// --- Supporting Components ---

const SuccessScreen = ({ theme, setCurrentView }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`min-h-screen bg-gradient-to-br ${theme.bg} flex items-center justify-center px-4 py-12`}
  >
    <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-12 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="relative inline-block mb-10"
      >
        <div className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl" style={{ backgroundColor: theme.primary }}>
          <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 rounded-full bg-white/30"
        />
      </motion.div>
      
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Ticket Created!</h1>
      <p className="text-xl text-gray-700 mb-3">Support ticket #TKT{Date.now().toString(36).toUpperCase()}</p>
      <p className="text-gray-600 mb-8 leading-relaxed">
        We've received your request and assigned it to our team. You'll receive updates via email.
      </p>
      
      <div className="space-y-4">
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all"
          style={{ backgroundColor: theme.primary }}
        >
          Send Another Message
        </button>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setCurrentView('chat')}
            className="py-3 rounded-xl border-2 font-semibold hover:bg-gray-50 transition-all"
          >
            Live Chat
          </button>
          <button
            onClick={() => setCurrentView('faq')}
            className="py-3 rounded-xl border-2 font-semibold hover:bg-gray-50 transition-all"
          >
            Help Center
          </button>
        </div>
      </div>
      
      <div className="mt-10 pt-8 border-t border-gray-200">
        <h4 className="font-bold mb-2">What Happens Next?</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Confirmation email within 2 minutes</li>
          <li>2. Initial response within 2 hours</li>
          <li>3. Regular updates until resolution</li>
        </ol>
      </div>
    </div>
  </motion.div>
);

const ActionButton = ({ icon, label, description, onClick, color }) => (
  <button
    onClick={onClick}
    className="w-full p-5 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-between gap-4"
    style={{ backgroundColor: `${color}15`, border: `2px solid ${color}30` }}
  >
    <span className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <span>{label}</span>
    </span>
    <span className="text-sm font-normal opacity-70">{description}</span>
  </button>
);

const StatItem = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="opacity-90">{label}</span>
    <span className="font-bold text-xl">{value}</span>
  </div>
);

const PreviewField = ({ label, value }) => (
  <div>
    <span className="text-sm font-medium text-gray-500">{label}:</span>
    <div className="font-medium mt-1">{value || <span className="opacity-50">Not specified</span>}</div>
  </div>
);

// --- Utility Functions ---

const showToast = (message, type = 'info') => {
  // Implement toast notification
  console.log(`${type.toUpperCase()}: ${message}`);
};

const clearDrafts = () => {
  ['name', 'email', 'subject', 'message', 'priority', 'category', 'attachments', 'full', 'timestamp'].forEach(key => {
    localStorage.removeItem(`emailDraft_${key}`);
  });
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const logSupportRequest = (data) => {
  // Send analytics data to your backend
  console.log('Support request logged:', data);
};