/*
 * App.tsx
 * Main application component with routing configuration.
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import FloatingChatbot from "./components/common/FloatingChatbot";

// Import all pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import KycPage from "./pages/KycPage";
import DepositPage from "./pages/DepositPage";
import WithdrawPage from "./pages/WithdrawPage";
import TransferPage from "./pages/TransferPage";
import TransactionsHistoryPage from "./pages/TransactionsHistoryPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminDepositsPage from "./pages/AdminDepositsPage";
import AdminWithdrawalsPage from "./pages/AdminWithdrawalsPage";
import AdminTransfersPage from "./pages/AdminTransfersPage";
import NotFound from "./pages/NotFound";

// AI/ML Feature Pages
import AIInsightsPage from "./pages/AIInsightsPage";
import AIFraudDetectionPage from "./pages/AIFraudDetectionPage";
import MLCreditScoringPage from "./pages/MLCreditScoringPage";

// Import global styles
import "./styles/global.css";

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          {/* Public Routes (no Navbar) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected User Routes (with Navbar) */}
          <Route
            path="/dashboard"
            element={
              <>
                <Navbar />
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              </>
            }
          />
          <Route
            path="/kyc"
            element={
              <>
                <Navbar />
                <ProtectedRoute>
                  <KycPage />
                </ProtectedRoute>
              </>
            }
          />
          <Route
            path="/deposit"
            element={
              <>
                <Navbar />
                <ProtectedRoute>
                  <DepositPage />
                </ProtectedRoute>
              </>
            }
          />
          <Route
            path="/withdraw"
            element={
              <>
                <Navbar />
                <ProtectedRoute>
                  <WithdrawPage />
                </ProtectedRoute>
              </>
            }
          />
          <Route
            path="/transfer"
            element={
              <>
                <Navbar />
                <ProtectedRoute>
                  <TransferPage />
                </ProtectedRoute>
              </>
            }
          />
          <Route
            path="/transactions"
            element={
              <>
                <Navbar />
                <ProtectedRoute>
                  <TransactionsHistoryPage />
                </ProtectedRoute>
              </>
            }
          />
          <Route
            path="/credit-scoring"
            element={
              <>
                <Navbar />
                <ProtectedRoute>
                  <MLCreditScoringPage />
                </ProtectedRoute>
              </>
            }
          />

          {/* AI/ML Feature Routes (removed - now in protected user routes) */}
          <Route path="/ai" element={<AIInsightsPage />} />
          <Route path="/ai/fraud-detection" element={<AIFraudDetectionPage />} />

          {/* Admin Routes - Protected */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/deposits"
            element={
              <ProtectedRoute adminOnly>
                <AdminDepositsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/withdrawals"
            element={
              <ProtectedRoute adminOnly>
                <AdminWithdrawalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/transfers"
            element={
              <ProtectedRoute adminOnly>
                <AdminTransfersPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        <FloatingChatbot />
      </div>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
