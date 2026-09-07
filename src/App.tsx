import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import Layout from './components/Layout';
import { useAuth } from './components/AuthContext';

// Lazy load the pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Instruments = lazy(() => import('./pages/Instruments'));
const Applications = lazy(() => import('./pages/Applications'));
const ApplicationDetails = lazy(() => import('./pages/ApplicationDetails'));
const FieldInspection = lazy(() => import('./pages/FieldInspection'));
const CertificateView = lazy(() => import('./pages/CertificateView'));
const Settings = lazy(() => import('./pages/Settings'));
const Business = lazy(() => import('./pages/Business'));
const InspectionsList = lazy(() => import('./pages/InspectionsList'));
const CertificatesList = lazy(() => import('./pages/CertificatesList'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Help = lazy(() => import('./pages/Help'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const PublicVerify = lazy(() => import('./pages/PublicVerify'));
const ConsumerScan = lazy(() => import('./pages/ConsumerScan'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
    <div className="flex flex-col items-center gap-4 text-primary opacity-70">
      <span className="material-symbols-outlined text-4xl animate-spin" style={{ fontVariationSettings: "'FILL' 0" }}>sync</span>
      <span className="font-label-lg text-label-lg font-bold">Loading module...</span>
    </div>
  </div>
);

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode, allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If the user does not have permission, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <Suspense fallback={<PageLoader />}>
            <Login />
          </Suspense>
        } />
        <Route path="/signup" element={
          <Suspense fallback={<PageLoader />}>
            <Signup />
          </Suspense>
        } />
        <Route path="/verify/:certId" element={
          <Suspense fallback={<PageLoader />}>
            <PublicVerify />
          </Suspense>
        } />
        <Route path="/scan" element={
          <Suspense fallback={<PageLoader />}>
            <ConsumerScan />
          </Suspense>
        } />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          } />
          <Route path="business" element={
            <ProtectedRoute allowedRoles={['BUSINESS']}>
              <Suspense fallback={<PageLoader />}>
                <Business />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="instruments" element={
            <Suspense fallback={<PageLoader />}>
              <Instruments />
            </Suspense>
          } />
          <Route path="applications" element={
            <Suspense fallback={<PageLoader />}>
              <Applications />
            </Suspense>
          } />
          <Route path="applications/:id" element={
            <Suspense fallback={<PageLoader />}>
              <ApplicationDetails />
            </Suspense>
          } />
          <Route path="inspections" element={
            <ProtectedRoute allowedRoles={['LMO', 'GATC', 'ADMIN']}>
              <Suspense fallback={<PageLoader />}>
                <InspectionsList />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="inspections/:id" element={
            <ProtectedRoute allowedRoles={['LMO', 'GATC', 'ADMIN']}>
              <Suspense fallback={<PageLoader />}>
                <FieldInspection />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="certificates" element={
            <Suspense fallback={<PageLoader />}>
              <CertificatesList />
            </Suspense>
          } />
          <Route path="certificates/:id" element={
            <Suspense fallback={<PageLoader />}>
              <CertificateView />
            </Suspense>
          } />
          <Route path="logs" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Suspense fallback={<PageLoader />}>
                <AuditLogs />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <Suspense fallback={<PageLoader />}>
              <Settings />
            </Suspense>
          } />
          <Route path="help" element={
            <Suspense fallback={<PageLoader />}>
              <Help />
            </Suspense>
          } />
          {/* Fallbacks */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
