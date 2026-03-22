/*
 * AIInsightsPage.tsx
 * Central AI/ML dashboard showing all AI features and model performance.
 * Acts as a hub for all AI/ML features in the project.
 */

import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

// AI/ML features summary
const aiFeatures = [
  {
    id: 1,
    title: 'Fraud Detection System',
    description: 'Real-time transaction monitoring using Random Forest and LSTM neural networks to detect suspicious activities.',
    icon: 'FRAUD',
    link: '/ai/fraud-detection',
    accuracy: '94.5%',
    model: 'Random Forest + LSTM',
    status: 'Active'
  },
  {
    id: 2,
    title: 'Credit Scoring',
    description: 'ML-based creditworthiness prediction using XGBoost to calculate credit scores (300-850).',
    icon: 'SCORING',
    link: '/ai/credit-scoring',
    accuracy: '91.2%',
    model: 'XGBoost Regressor',
    status: 'Active'
  },
  {
    id: 3,
    title: 'AI Chatbot',
    description: 'NLP-powered customer support using BERT for intent classification and response generation.',
    icon: 'CHATBOT',
    link: '/ai/chatbot',
    accuracy: '92.7%',
    model: 'BERT Classifier',
    status: 'Active'
  },
  {
    id: 4,
    title: 'Spending Analysis',
    description: 'Transaction categorization and spending prediction using K-Means clustering and ARIMA forecasting.',
    icon: 'ANALYSIS',
    link: '/ai/spending-analysis',
    accuracy: '94.1%',
    model: 'K-Means + ARIMA',
    status: 'Active'
  },
];

// Model performance metrics
const modelMetrics = {
  totalPredictions: '45,230',
  avgResponseTime: '120ms',
  uptime: '99.9%',
  modelsDeployed: 4,
};

function AIInsightsPage() {
  const { isLoggedIn, user } = useAuth();

  // Redirect if not logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="main-content ai-modern">
      {/* Page Header */}
      <div className="page-header">
        <h1>AI & ML Features Dashboard</h1>
        <p>Overview of all Artificial Intelligence and Machine Learning capabilities</p>
      </div>

      {/* Overall Stats */}
      <div className="stats-grid">
        <Card>
          <div className="stat-item">
            <h3>Total Predictions</h3>
            <p className="stat-value">{modelMetrics.totalPredictions}</p>
            <small>Last 30 days</small>
          </div>
        </Card>
        <Card>
          <div className="stat-item">
            <h3>Avg Response Time</h3>
            <p className="stat-value">{modelMetrics.avgResponseTime}</p>
            <small>ML inference time</small>
          </div>
        </Card>
        <Card>
          <div className="stat-item">
            <h3>System Uptime</h3>
            <p className="stat-value" style={{ color: '#22c55e' }}>{modelMetrics.uptime}</p>
            <small>AI services</small>
          </div>
        </Card>
        <Card>
          <div className="stat-item">
            <h3>Models Deployed</h3>
            <p className="stat-value">{modelMetrics.modelsDeployed}</p>
            <small>Production models</small>
          </div>
        </Card>
      </div>

      {/* AI Features Grid */}
      <Card title="AI/ML Features">
        <div className="ai-features-grid">
          {aiFeatures.map((feature) => (
            <div key={feature.id} className="ai-feature-card">
              <div className="feature-header">
                <span className="feature-icon">{feature.icon}</span>
                <span className={`feature-status ${feature.status.toLowerCase()}`}>
                  {feature.status}
                </span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-meta">
                <div className="meta-item">
                  <span className="meta-label">Model:</span>
                  <span className="meta-value">{feature.model}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Accuracy:</span>
                  <span className="meta-value accuracy">{feature.accuracy}</span>
                </div>
              </div>
              <Link to={feature.link}>
                <Button variant="secondary" size="small">
                  Open Feature →
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </Card>

      {/* Technology Stack */}
      <Card title="AI/ML Technology Stack">
        <div className="tech-stack">
          <div className="tech-category">
            <h4>Machine Learning</h4>
            <div className="tech-tags">
              <span className="tech-tag">Python</span>
              <span className="tech-tag">Scikit-learn</span>
              <span className="tech-tag">XGBoost</span>
              <span className="tech-tag">TensorFlow</span>
            </div>
          </div>
          <div className="tech-category">
            <h4>Deep Learning</h4>
            <div className="tech-tags">
              <span className="tech-tag">LSTM</span>
              <span className="tech-tag">BERT</span>
              <span className="tech-tag">Neural Networks</span>
              <span className="tech-tag">Keras</span>
            </div>
          </div>
          <div className="tech-category">
            <h4>NLP</h4>
            <div className="tech-tags">
              <span className="tech-tag">NLTK</span>
              <span className="tech-tag">spaCy</span>
              <span className="tech-tag">Transformers</span>
              <span className="tech-tag">Hugging Face</span>
            </div>
          </div>
          <div className="tech-category">
            <h4>Data Processing</h4>
            <div className="tech-tags">
              <span className="tech-tag">Pandas</span>
              <span className="tech-tag">NumPy</span>
              <span className="tech-tag">Feature Engineering</span>
              <span className="tech-tag">Data Pipelines</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ML Algorithms Summary */}
      <Card title="📚 ML Algorithms Used in Project">
        <div className="algorithms-table">
          <table>
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Type</th>
                <th>Use Case</th>
                <th>Key Advantage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Random Forest</td>
                <td>Ensemble Learning</td>
                <td>Fraud Detection</td>
                <td>High accuracy, handles imbalanced data</td>
              </tr>
              <tr>
                <td>XGBoost</td>
                <td>Gradient Boosting</td>
                <td>Credit Scoring</td>
                <td>Fast training, regularization</td>
              </tr>
              <tr>
                <td>LSTM</td>
                <td>Deep Learning (RNN)</td>
                <td>Sequential Pattern Detection</td>
                <td>Captures temporal dependencies</td>
              </tr>
              <tr>
                <td>BERT</td>
                <td>Transformer (NLP)</td>
                <td>Intent Classification</td>
                <td>Context-aware understanding</td>
              </tr>
              <tr>
                <td>K-Means</td>
                <td>Clustering</td>
                <td>Transaction Categorization</td>
                <td>Unsupervised grouping</td>
              </tr>
              <tr>
                <td>ARIMA</td>
                <td>Time Series</td>
                <td>Spending Prediction</td>
                <td>Forecasting future values</td>
              </tr>
              <tr>
                <td>Isolation Forest</td>
                <td>Anomaly Detection</td>
                <td>Outlier Detection</td>
                <td>Efficient anomaly identification</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Project Architecture */}
      <Card title="🏗️ AI/ML Architecture">
        <div className="architecture-diagram">
          <div className="arch-layer">
            <h4>Frontend Layer</h4>
            <div className="arch-components">
              <span>React UI</span>
              <span>AI Dashboards</span>
              <span>Real-time Updates</span>
            </div>
          </div>
          <div className="arch-arrow">↓ API Calls ↓</div>
          <div className="arch-layer">
            <h4>Backend Layer (Node.js + Express)</h4>
            <div className="arch-components">
              <span>REST APIs</span>
              <span>Authentication</span>
              <span>Data Validation</span>
            </div>
          </div>
          <div className="arch-arrow">↓ ML Service Calls ↓</div>
          <div className="arch-layer highlight">
            <h4>ML Service Layer (Python)</h4>
            <div className="arch-components">
              <span>Model Inference</span>
              <span>Feature Engineering</span>
              <span>Prediction APIs</span>
            </div>
          </div>
          <div className="arch-arrow">↓ Data Storage ↓</div>
          <div className="arch-layer">
            <h4>Data Layer</h4>
            <div className="arch-components">
              <span>MongoDB</span>
              <span>Model Storage</span>
              <span>Training Data</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AIInsightsPage;
