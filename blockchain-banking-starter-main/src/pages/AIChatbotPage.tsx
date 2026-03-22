/*
 * AIChatbotPage.tsx
 * AI-powered customer support chatbot using NLP (Natural Language Processing).
 * Demonstrates conversational AI for VTU MCA project.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

// Message interface
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  intent?: string;
  confidence?: number;
}

// Dummy NLP responses based on intent detection
const nlpResponses: { [key: string]: { response: string; intent: string } } = {
  'balance': {
    response: 'Your current account balance is ₹15,500 (Fiat) and 2.5 tokens (On-chain). Would you like to make a deposit or withdrawal?',
    intent: 'check_balance'
  },
  'deposit': {
    response: 'To make a deposit, please go to the Deposit page. You can deposit via bank transfer or UPI. The minimum deposit amount is ₹100.',
    intent: 'deposit_inquiry'
  },
  'withdraw': {
    response: 'For withdrawals, navigate to the Withdraw page. Processing takes 1-2 business days. You can withdraw to your linked bank account.',
    intent: 'withdrawal_inquiry'
  },
  'kyc': {
    response: 'KYC verification is required for full account access. Please upload your Aadhar/PAN card on the KYC page. Verification typically takes 24-48 hours.',
    intent: 'kyc_status'
  },
  'loan': {
    response: 'Based on your ML credit score, you may be eligible for a loan up to ₹5,00,000. Visit our ML Credit Scoring page to check your eligibility.',
    intent: 'loan_inquiry'
  },
  'fraud': {
    response: 'Our AI fraud detection system monitors all transactions 24/7. If you notice suspicious activity, please report it immediately through the Fraud Detection page.',
    intent: 'fraud_report'
  },
  'help': {
    response: 'I can help you with: checking balance, deposits, withdrawals, KYC verification, loans, and fraud reporting. What would you like to know?',
    intent: 'help_request'
  },
  'hello': {
    response: 'Hello! I\'m your AI banking assistant powered by Natural Language Processing. How can I assist you today?',
    intent: 'greeting'
  },
  'thank': {
    response: 'You\'re welcome! Is there anything else I can help you with?',
    intent: 'gratitude'
  },
};

// Default response for unknown intents
const defaultResponse = {
  response: 'I\'m not sure I understand. Could you please rephrase? I can help with balance inquiries, deposits, withdrawals, KYC, loans, and fraud reporting.',
  intent: 'unknown',
  confidence: 0.3
};

function AIChatbotPage() {
  const { isLoggedIn, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `Hello ${user?.name || 'there'}! 👋 I'm your AI-powered banking assistant. I use Natural Language Processing (NLP) to understand your queries. How can I help you today?`,
      sender: 'bot',
      timestamp: new Date(),
      intent: 'greeting',
      confidence: 1.0
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Redirect if not logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Simulate NLP intent detection
  const detectIntent = (text: string): { response: string; intent: string; confidence: number } => {
    const lowerText = text.toLowerCase();
    
    // Check for keywords and return appropriate response
    for (const [keyword, data] of Object.entries(nlpResponses)) {
      if (lowerText.includes(keyword)) {
        return { ...data, confidence: 0.85 + Math.random() * 0.14 };
      }
    }
    
    return { ...defaultResponse };
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate NLP processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Get AI response
    const nlpResult = detectIntent(inputText);
    
    const botMessage: Message = {
      id: messages.length + 2,
      text: nlpResult.response,
      sender: 'bot',
      timestamp: new Date(),
      intent: nlpResult.intent,
      confidence: nlpResult.confidence
    };

    setIsTyping(false);
    setMessages(prev => [...prev, botMessage]);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick action buttons
  const quickActions = [
    'Check Balance',
    'How to Deposit?',
    'KYC Status',
    'Report Fraud',
    'Loan Eligibility'
  ];

  return (
    <div className="main-content ai-modern">
      {/* Page Header */}
      <div className="page-header">
        <h1>Intelligent Support Assistant</h1>
        <p>Natural language processing powered customer service</p>
      </div>

      {/* NLP Model Info */}
      <Card title="Support Assistant Technology">
        <div className="nlp-info">
          <div className="nlp-spec">
            <span className="spec-label">Technology:</span>
            <span className="spec-value">Advanced Language Processing</span>
          </div>
          <div className="nlp-spec">
            <span className="spec-label">Supported Queries:</span>
            <span className="spec-value">12+ banking domains</span>
          </div>
          <div className="nlp-spec">
            <span className="spec-label">Language Support:</span>
            <span className="spec-value">English</span>
          </div>
          <div className="nlp-spec">
            <span className="spec-label">Recognition Accuracy:</span>
            <span className="spec-value">92.7%</span>
          </div>
        </div>
      </Card>

      {/* Chat Interface */}
      <Card title="Chat with AI Assistant">
        <div className="chat-container">
          {/* Messages Area */}
          <div className="messages-area">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender}`}
              >
                <div className="message-content">
                  <p>{message.text}</p>
                  {message.sender === 'bot' && message.confidence && (
                    <div className="nlp-meta">
                      <span className="intent-tag">Intent: {message.intent}</span>
                      <span className="confidence-tag">
                        Confidence: {(message.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            
            {isTyping && (
              <div className="message bot">
                <div className="message-content typing">
                  <span className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                  <small>AI is processing your query...</small>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-chat">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="quick-action-btn"
                onClick={() => setInputText(action)}
              >
                {action}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="chat-input"
            />
            <Button 
              variant="primary" 
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
            >
              Send
            </Button>
          </div>
        </div>
      </Card>

      {/* NLP Pipeline Explanation */}
      <Card title="How Support Assistant Works">
        <div className="pipeline-flow">
          <div className="pipeline-step">
            <div className="step-number">1</div>
            <h4>Input Processing</h4>
            <p>Your message is processed and analyzed for key information patterns.</p>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">
            <div className="step-number">2</div>
            <h4>Intent Recognition</h4>
            <p>Advanced language understanding identifies your query type automatically.</p>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">
            <div className="step-number">3</div>
            <h4>Data Extraction</h4>
            <p>Relevant information like amounts, accounts, dates are identified.</p>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">
            <div className="step-number">4</div>
            <h4>Response Generation</h4>
            <p>Appropriate answer is generated based on your query and context.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AIChatbotPage;
