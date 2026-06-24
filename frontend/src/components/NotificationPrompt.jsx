import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ms-notif-asked';
const CHECK_HOUR = 20;

export default function NotificationPrompt({ hasTodayLog }) {
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        if (Notification.permission === 'granted' || localStorage.getItem(STORAGE_KEY)) return;
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (Notification.permission !== 'granted') return;
        const now = new Date();
        const reminder = new Date();
        reminder.setHours(CHECK_HOUR, 0, 0, 0);
        if (now > reminder) reminder.setDate(reminder.getDate() + 1);
        const msUntil = reminder - now;

        const t = setTimeout(() => {
            if (!hasTodayLog) {
                new Notification('MindSpace 🌿', {
                    body: 'Сè уште немаш check-in за денес. Потребни се само 2 минути!',
                    icon: '/favicon.ico',
                });
            }
        }, msUntil);
        return () => clearTimeout(t);
    }, [hasTodayLog]);

    async function handleAllow() {
        localStorage.setItem(STORAGE_KEY, '1');
        setShowPrompt(false);
        await Notification.requestPermission();
    }

    function handleDismiss() {
        localStorage.setItem(STORAGE_KEY, '1');
        setShowPrompt(false);
    }

    if (!showPrompt) return null;

    return (
        <div style={{
            position: 'fixed', bottom: '5rem', right: '1.5rem', zIndex: 500,
            background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.2rem 1.4rem', maxWidth: 300,
            boxShadow: 'var(--shadow-lift)', border: '1px solid var(--color-border)',
        }}>
            <p style={{ margin: '0 0 0.4rem', fontWeight: 700 }}>🔔 Потсетувања</p>
            <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'var(--color-ink-muted)' }}>
                Дозволи известувања и ќе те потсетиме навечер ако немаш check-in за денес.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleAllow}>Дозволи</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleDismiss}>Не сега</button>
            </div>
        </div>
    );
}