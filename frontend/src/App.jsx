import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CheckInPage from './pages/CheckInPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import WallPage from './pages/WallPage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import HelpPage from './pages/HelpPage.jsx';

function RequireAuth({ children }) {
    const { session, loading } = useAuth();
    if (loading) return <CenteredLoading />;
    if (!session) return <Navigate to="/login" replace />;
    return children;
}

function RequireStaff({ children }) {
    const { profile, loading } = useAuth();
    if (loading) return <CenteredLoading />;
    const isStaff = profile?.role === 'teacher' || profile?.role === 'psychologist';
    if (!isStaff) return <Navigate to="/" replace />;
    return children;
}

function CenteredLoading() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-muted)' }}>
            Се вчитува...
        </div>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/about" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
                element={
                    <RequireAuth>
                        <Layout />
                    </RequireAuth>
                }
            >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/check-in" element={<CheckInPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/wall" element={<WallPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route
                    path="/admin"
                    element={
                        <RequireStaff>
                            <AdminPage />
                        </RequireStaff>
                    }
                />
            </Route>

            <Route path="*" element={<Navigate to="/about" replace />} />
        </Routes>
    );
}