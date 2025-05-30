import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { AppLayout } from './layouts/AppLayout';
import { ProblemList } from './components/ProblemList';
import { ProblemView } from './components/ProblemView';
import { CreateProblem } from './components/CreateProblem';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="app min-h-screen bg-background text-foreground">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Public problem routes */}
          <Route
            path="/problems"
            element={
              <AppLayout>
                <ProblemList />
              </AppLayout>
            }
          />
          <Route
            path="/problems/:id"
            element={
              <AppLayout>
                <ProblemView />
              </AppLayout>
            }
          />

          {/* Protected routes */}
          <Route
            path="/problems/new"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AppLayout>
                    <CreateProblem />
                  </AppLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
