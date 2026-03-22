/*
 * FloatingChatbot.tsx
 * Floating chatbot widget similar to WhatsApp's meta button.
 * Appears in the bottom-right corner of the screen on all pages.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './FloatingChatbot.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const nlpResponses: { [key: string]: string } = {
  'balance': 'Your current account balance is shown in your dashboard. Go to Dashboard to view your Fiat and Token balances.',
  'deposit': 'To make a deposit, go to Deposit page. You can deposit via bank transfer. Minimum deposit amount is ₹100.',
  'withdraw': 'For withdrawals, navigate to Withdraw page. Processing takes 1-2 business days to your linked bank account.',
  'transfer': 'To transfer money, go to Transfer page. You can send funds to other account holders. Enter recipient details and amount.',
  'kyc': 'KYC verification is required for full account access. Upload your Aadhar/PAN on KYC page. Verification takes 24-48 hours.',
  'loan': 'Check ML Credit Scoring page to see your loan eligibility based on your credit score.',
  'fraud': 'Our AI fraud detection monitors all transactions 24/7. Report suspicious activity via AI Fraud Detection page.',
  'transaction': 'View all your transactions on Transactions History page with filters by type, status, and fraud risk.',
  'help': 'I can help with: balance inquiries, deposits, withdrawals, transfers, KYC, loans, and fraud reporting. What do you need?',
  'hello': 'Hello! 👋 I\'m your AI banking assistant. How can I help you today?',
  'thank': 'You\'re welcome! Is there anything else I can help with?',
};

const adminNlpResponses: { [key: string]: string } = {
  'pending': 'Go to Admin Dashboard → Deposits, Withdrawals, or Transfers sections to view and approve pending transactions.',
  'kyc': 'Check Admin Dashboard → KYC Verification Requests to see all pending KYC applications. Current status: 9 Pending KYC',
  'users': 'Your system has 9 total users. Go to Admin Dashboard to view user statistics and details.',
  'stats': 'View real-time system stats on Admin Dashboard: Total Users, Deposits (₹131K), Withdrawals (₹500), Pending KYC (9)',
  'transactions': 'Go to Admin Dashboard → Deposits/Withdrawals/Transfers to manage all pending approvals and view transaction history.',
  'approve': 'To approve transactions, go to Admin Dashboard → Deposits/Withdrawals/Transfers and click approve on pending items.',
  'reject': 'To reject transactions, go to Admin Dashboard → Deposits/Withdrawals/Transfers and provide a rejection reason.',
  'analytics': 'View Analytics on Admin Dashboard: Transaction Trends (Last 7 Days), Deposit vs Withdrawal Comparison, KYC Status Distribution.',
  'help': 'I can help admins with: pending transactions, KYC requests, user statistics, system analytics, approvals, and rejections. What do you need?',
  'hello': 'Hello Admin! 👋 I\'m your AI admin assistant. How can I help manage the system?',
  'thank': 'You\'re welcome! Is there anything else I can help with?',
};

function FloatingChatbot() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: isAdmin ? 'Hello Admin! 👋 I\'m your AI admin assistant. How can I help manage the system?' : 'Hi there! 👋 I\'m your AI banking assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect intent and get response
  const detectIntent = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    // Use admin responses if user is admin, otherwise use regular responses
    const responseSet = isAdmin ? adminNlpResponses : nlpResponses;

    for (const keyword in responseSet) {
      if (lowerText.includes(keyword)) {
        return responseSet[keyword];
      }
    }

    // Default responses based on user type
    if (isAdmin) {
      return 'I can help with admin tasks. Try asking about: pending transactions, KYC requests, user statistics, analytics, or approvals.';
    }
    
    return 'I\'m here to help with banking questions. Try asking about: balance, deposit, withdraw, transfer, KYC, loan, or fraud detection.';
  };

  // Handle sending message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot response delay
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: detectIntent(inputText),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 500);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="floating-chatbot-button"
        title="Open chat"
        aria-label="Open AI Banking Assistant"
      >
        <span className="chatbot-icon">💬</span>
        {!isOpen && <span className="chatbot-badge">1</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="floating-chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div>
              <h3>Banking Assistant</h3>
              <p className="chatbot-status">Online • AI-Powered</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="chatbot-close-btn"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div className="chatbot-messages">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-bubble">
                  {msg.text}
                </div>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="message bot-message">
                <div className="message-bubble typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="chatbot-input-form">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Ask me anything..."
              className="chatbot-input"
              disabled={isTyping}
              autoFocus
            />
            <button
              type="submit"
              disabled={isTyping || !inputText.trim()}
              className="chatbot-send-btn"
              title="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default FloatingChatbot;
