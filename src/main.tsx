import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import AdminLayout from './admin/AdminLayout.tsx';
import AdminDashboard from './admin/pages/AdminDashboard.tsx';
import AdminProducts from './admin/pages/AdminProducts.tsx';
import AdminCategories from './admin/pages/AdminCategories.tsx';
import AdminFAQItems from './admin/pages/AdminFAQItems.tsx';
import AdminLogin from './admin/pages/AdminLogin.tsx';
import AdminSettings from './admin/pages/AdminSettings.tsx';
import AdminApiKeys from './admin/pages/AdminApiKeys.tsx';
import AdminApiDocs from './admin/pages/AdminApiDocs.tsx';
import AdminTemplates from './admin/pages/AdminTemplates.tsx';
import AdminAIGenerator from './admin/pages/AdminAIGenerator.tsx';
import AdminUsers from './admin/pages/AdminUsers.tsx';
import AdminProfile from './admin/pages/AdminProfile.tsx';
import SetupWizard from './admin/pages/SetupWizard.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { DataProvider } from './context/DataContext.tsx';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
    <AuthProvider>
      <SettingsProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/setup" element={<SetupWizard />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="faq-items" element={<AdminFAQItems />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="templates" element={<AdminTemplates />} />
                <Route path="ai-generator" element={<AdminAIGenerator />} />
                <Route path="api-keys" element={<AdminApiKeys />} />
                <Route path="api-docs" element={<AdminApiDocs />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="profile" element={<AdminProfile />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </SettingsProvider>
    </AuthProvider>
    </HelmetProvider>
  </StrictMode>,
);
