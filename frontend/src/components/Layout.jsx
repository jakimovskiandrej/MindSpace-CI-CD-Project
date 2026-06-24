import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import SOSBreathingButton from './SOSBreathingButton.jsx';
import NotificationPrompt from './NotificationPrompt.jsx';
import OnboardingTour from './OnboardingTour.jsx';

const NAV_ITEMS = [
    { to: '/', label: 'Почетна', icon: '🏠', end: true },
    { to: '/check-in', label: 'Check-in', icon: '📝' },
    { to: '/analytics', label: 'Аналитика', icon: '📊' },
    { to: '/wall', label: 'Ѕид', icon: '💬' },
    { to: '/groups', label: 'Групи', icon: '👥' },
    { to: '/help', label: 'Помош', icon: '❤️' },
    { to: '/settings', label: 'Поставки', icon: '⚙️' },
];

export default function Layout() {
    const { profile, signOut } = useAuth();
    const [showTour, setShowTour] = useState(false);
    const isStaff = profile?.role === 'teacher' || profile?.role === 'psychologist';

    const items = isStaff
        ? [...NAV_ITEMS, { to: '/admin', label: 'Admin', icon: '🧑‍⚕️' }]
        : NAV_ITEMS;

    return (
        <div className="app-shell">
            <nav className="sidebar">
                <div className="sidebar-brand">
                    <span style={{ fontSize: '1.4rem' }}>🌿</span>
                    <span className="sidebar-brand-text">MindSpace</span>
                </div>

                <div className="sidebar-links">
                    {items.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                        >
                            <span aria-hidden="true">{item.icon}</span>
                            <span className="sidebar-link-text">{item.label}</span>
                        </NavLink>
                    ))}
                </div>

                <div className="sidebar-footer">
                    <p
                        className="sidebar-link-text"
                        style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', margin: '0 0 0.4rem 0.9rem' }}
                    >
                        {profile?.username}
                    </p>
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm sidebar-link-text"
                        onClick={() => setShowTour(true)}
                        style={{ marginLeft: '0.5rem', marginBottom: '0.25rem', fontSize: '0.78rem' }}
                    >
                        🧭 Водич
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm sidebar-link-text"
                        onClick={signOut}
                        style={{ marginLeft: '0.5rem' }}
                    >
                        Одјави се
                    </button>
                </div>
            </nav>

            <main className="main-content">
                <Outlet />
            </main>

            <OnboardingTour forceShow={showTour} onClose={() => setShowTour(false)} />
            <NotificationPrompt hasTodayLog={false} />
            <SOSBreathingButton />

            <style>{`
        .sidebar {
          width: 220px;
          flex-shrink: 0;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          padding: 1.25rem 0.75rem;
          position: sticky;
          top: 0;
          height: 100vh;
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem 1.5rem;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 1.15rem;
          color: var(--color-primary-deep);
        }
        .sidebar-links { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.9rem;
          border-radius: var(--radius-md);
          text-decoration: none;
          color: var(--color-ink);
          font-weight: 500;
          font-size: 0.92rem;
        }
        .sidebar-link:hover { background: var(--color-bg-soft); }
        .sidebar-link.active { background: var(--color-primary-soft); color: var(--color-primary-deep); font-weight: 600; }
        .sidebar-footer {
          padding-top: 0.75rem;
          border-top: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        @media (max-width: 760px) {
          .app-shell { flex-direction: column; }
          .sidebar {
            width: 100%;
            height: auto;
            position: fixed;
            bottom: 0;
            top: auto;
            left: 0;
            flex-direction: row;
            align-items: center;
            border-right: none;
            border-top: 1px solid var(--color-border);
            padding: 0.5rem;
            z-index: 30;
          }
          .sidebar-brand, .sidebar-footer { display: none; }
          .sidebar-links { flex-direction: row; flex: 1; justify-content: space-around; }
          .sidebar-link { flex-direction: column; gap: 0.15rem; padding: 0.4rem 0.5rem; font-size: 0.68rem; }
          .sidebar-link-text { font-size: 0.65rem; }
          .main-content { padding-bottom: 5.5rem; }
        }
      `}</style>
        </div>
    );
}