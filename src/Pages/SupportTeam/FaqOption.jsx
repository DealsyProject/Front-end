// FaqOption.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Define the primary color utility for better readability
const PRIMARY_COLOR_HEX = '#586330'; // Olive/Moss Green
const LIGHT_COLOR = '#f7fee7'; // Light Lime (equivalent to lime-50)

function FaqOption() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  const categories = {
    all: 'All Questions',
    account: 'Account & Sign Up',
    payment: 'Payment & Billing',
    shipping: 'Shipping & Delivery',
    returns: 'Returns & Refunds',
    security: 'Security & Privacy',
    technical: 'Technical Support'
  };

  const faqData = [
    {
      question: "How do I create an account?",
      answer: "Click the 'Sign Up' button in the top right corner, enter your email address, create a password, and fill in your basic information. You'll receive a verification email to activate your account.",
      category: 'account'
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are securely processed through encrypted channels with PCI-DSS compliance.",
      category: 'payment'
    },
    {
      question: "How can I track my order?",
      answer: "Once your order is shipped, you'll receive a tracking number via email and SMS. You can also log into your account and visit 'Order History' to track your package in real-time with detailed delivery updates.",
      category: 'shipping'
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day hassle-free return policy for most items. Products must be unused, in original packaging with all tags attached. Electronics have a 14-day return window, while personalized items and perishables are final sale.",
      category: 'returns'
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping: 3-5 business days • Express shipping: 1-2 business days • Overnight shipping: Available for most locations • International shipping: 7-14 business days. Delivery times may vary during holidays.",
      category: 'shipping'
    },
    {
      question: "Do you offer international shipping?",
      answer: "Yes! We ship to over 100 countries worldwide. International shipping typically takes 7-14 business days. Customs fees and import taxes are calculated at checkout for complete transparency.",
      category: 'shipping'
    },
    {
      question: "How can I contact customer support?",
      answer: "• Live Chat: Available 24/7 (Instant connection) • Email: support@dealsy.com (Under 2 hours response) • Phone: 1-800-332-5791 (Under 2 minutes wait time) • Social Media: @dealsysupport",
      category: 'technical'
    },
    {
      question: "Is my personal information secure?",
      answer: "Absolutely. We use 256-bit SSL encryption, comply with GDPR and CCPA regulations, and undergo regular security audits. Payment details are tokenized and never stored on our servers. Your privacy is our top priority.",
      category: 'security'
    },
    {
      question: "Can I modify or cancel my order?",
      answer: "You can modify or cancel your order within 1 hour of placement from your 'Order History' page. After that window, contact our support team immediately—we process orders quickly to ensure fast delivery.",
      category: 'account'
    },
    {
      question: "Do you have a loyalty program?",
      answer: "Yes! Our Dealsy Rewards program gives you 1 point per $1 spent. Reach Silver status at 100 points, Gold at 500 points, and Platinum at 2000 points. Enjoy exclusive discounts, early access to sales, and birthday rewards!",
      category: 'account'
    },
    {
      question: "How do I reset my password?",
      answer: "Click 'Forgot Password' on the login page, enter your email address, and we'll send you a secure link to create a new password. The link expires in 1 hour for security purposes.",
      category: 'account'
    },
    {
      question: "Are my payment details stored securely?",
      answer: "Yes, we use tokenization through PCI-DSS compliant payment processors. Your actual card numbers are never stored on our servers. You can safely save payment methods for faster checkout.",
      category: 'security'
    }
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const filteredFaqs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category) => {
    const icons = {
      account: '👤',
      payment: '💳',
      shipping: '🚚',
      returns: '🔄',
      security: '🔒',
      technical: '🔧'
    };
    return icons[category] || '❓';
  };

  return (
    <div className={`min-h-screen bg-[${LIGHT_COLOR}] py-8 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-[${PRIMARY_COLOR_HEX}] rounded-2xl shadow-2xl mb-6 transform hover:rotate-3 transition-transform duration-300`}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
            How can we help you?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get instant answers to your questions with our comprehensive FAQ. Can't find what you're looking for? Our support team is ready to help.
          </p>
        </div>

        {/* Enhanced Search and Filter Section */}
        <div className="mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 transform hover:shadow-2xl transition-all duration-300">
            {/* Search Bar */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search questions or answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-6 py-5 pl-16 pr-6 text-lg text-gray-700 bg-gray-50/80 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[${PRIMARY_COLOR_HEX}] focus:ring-4 focus:ring-[#58633033] transition-all duration-300`}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-6">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-6"
                >
                  <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Category Filters - Olive Green Active State */}
            <div className="flex flex-wrap gap-3 justify-center">
              {Object.entries(categories).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-5 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    selectedCategory === key
                      ? `bg-[${PRIMARY_COLOR_HEX}] text-white shadow-lg` // Active: Olive Green
                      : `bg-white text-gray-700 border-2 border-gray-200 hover:border-[#58633080] hover:bg-[${LIGHT_COLOR}]` // Inactive: Hover with subtle Olive
                  }`}
                >
                  {key !== 'all' && <span className="mr-2">{getCategoryIcon(key)}</span>}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        {searchTerm && (
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              Found <span className={`font-semibold text-[${PRIMARY_COLOR_HEX}]`}>{filteredFaqs.length}</span> results for "<span className="font-semibold">{searchTerm}</span>"
            </p>
          </div>
        )}

        {/* Enhanced FAQ List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden transform hover:shadow-2xl transition-all duration-300">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-3">No results found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                We couldn't find any questions matching your search. Try different keywords or contact our support team.
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className={`bg-[${PRIMARY_COLOR_HEX}] text-white px-6 py-3 rounded-xl hover:opacity-90 transition-colors duration-200 font-medium`}
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => (
              <div 
                key={index}
                className={`group border-b border-gray-200/80 last:border-b-0 transition-all duration-300 ${
                  activeIndex === index 
                    ? `bg-[${LIGHT_COLOR}] border-l-4 border-l-[${PRIMARY_COLOR_HEX}]` // Active: Light Lime BG, Olive Border
                    : 'bg-white hover:bg-gray-50/80'
                }`}
              >
                {/* Question */}
                <button
                  className="w-full px-8 py-6 text-left transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#58633033] rounded-lg"
                  onClick={() => toggleFAQ(index)}
                >
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon Container */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        activeIndex === index 
                          ? `bg-[${PRIMARY_COLOR_HEX}] text-white scale-110` // Active: Olive Green
                          : `bg-gray-100 text-gray-600 group-hover:bg-lime-100 group-hover:text-[${PRIMARY_COLOR_HEX}]` // Inactive: Hover Lime
                      }`}>
                        <span className="text-sm font-medium">
                          {getCategoryIcon(faq.category)}
                        </span>
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 leading-relaxed">
                          {faq.question}
                        </h3>
                        <div className="flex items-center gap-3">
                          {/* Category Badge */}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            activeIndex === index
                              ? `bg-white/80 text-[${PRIMARY_COLOR_HEX}]` // Active: White badge, Olive text
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {categories[faq.category]}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Chevron Icon */}
                    <span className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-500 ${
                      activeIndex === index 
                        ? `bg-[${PRIMARY_COLOR_HEX}] text-white rotate-180 scale-110` // Active: Olive Green
                        : `bg-gray-100 text-gray-600 group-hover:bg-lime-100 group-hover:text-[${PRIMARY_COLOR_HEX}] group-hover:scale-110`
                    }`}>
                      <svg 
                        className="w-6 h-6 transition-transform duration-500" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 9l-7 7-7-7" 
                        />
                      </svg>
                    </span>
                  </div>
                </button>

                {/* Answer */}
                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    activeIndex === index 
                      ? 'max-h-96 opacity-100' 
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-8 pb-8">
                    <div className={`pl-14 border-l-4 border-[#58633080]`}> {/* Olive accent line */}
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {faq.answer}
                      </p>
                      {activeIndex === index && (
                        <div className={`mt-4 flex items-center gap-2 text-sm text-[${PRIMARY_COLOR_HEX}] font-medium`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Was this helpful?
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Enhanced Contact Support Section - Olive Green Background */}
        <div className={`mt-16 bg-[${PRIMARY_COLOR_HEX}] rounded-3xl shadow-2xl p-12 text-center text-white transform hover:shadow-2xl transition-all duration-300`}>
          <div className="max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold mb-4">
              Still need help? We've got you covered!
            </h3>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Our dedicated support team is available 24/7 to assist you with any questions or concerns. Choose your preferred way to connect with us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/customerchat')}
                className={`bg-white text-[${PRIMARY_COLOR_HEX}] px-8 py-4 rounded-xl hover:bg-lime-50 transition-all duration-300 font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Live Chat Now
              </button>
              <button 
                onClick={() => navigate('/support-emailsupport')}
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold flex items-center justify-center gap-3 hover:border-white/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Support
              </button>
              <button 
                onClick={() => window.open('tel:+1-800-332-5791')}
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold flex items-center justify-center gap-3 hover:border-white/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Support
              </button>
            </div>
            <div className="mt-6 text-white/70 text-sm">
              💡 <strong>Pro Tip:</strong> Live Chat gets you instant answers, while email is perfect for detailed issues.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FaqOption;