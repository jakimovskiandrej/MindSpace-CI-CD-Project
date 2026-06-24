import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';

const DEFAULT_GOALS = {
    maxScreenTime: 3,
    minSleep: 8,
    minMood: 3,
    checkInDays: 5,
};

const STORAGE_KEY = 'ms-weekly-goals';

function loadGoals() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? { ...DEFAULT_GOALS, ...JSON.parse(stored) } : DEFAULT_GOALS;
    } catch { return DEFAULT_GOALS; }
}

export default function WeeklyGoals() {
    const [goals, setGoals] = useState(loadGoals);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(goals);
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        api.get('/logs/me?limit=7').then((res) => {
            const logs = res.logs || [];
            if (!logs.length) return;

            const now = new Date();
            const monday = new Date(now);
            monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
            monday.setUTCHours(0, 0, 0, 0);
            const week = logs.filter((l) => new Date(l.created_at) >= monday);

            const avgScreen = week.length ? week.reduce((s, l) => s + Number(l.screen_time_hours), 0) / week.length : null;
            const avgSleep  = week.filter(l => l.sleep_hours).length
                ? week.filter(l => l.sleep_hours).reduce((s, l) => s + Number(l.sleep_hours), 0) / week.filter(l => l.sleep_hours).length
                : null;
            const avgMood   = week.length ? week.reduce((s, l) => s + l.mood_score, 0) / week.length : null;

            setProgress({
                screenDays: week.filter((l) => Number(l.screen_time_hours) <= goals.maxScreenTime).length,
                sleepDays:  week.filter((l) => l.sleep_hours != null && Number(l.sleep_hours) >= goals.minSleep).length,
                moodDays:   week.filter((l) => l.mood_score >= goals.minMood).length,
                checkIns:   week.length,
                avgScreen, avgSleep, avgMood,
                total: week.length,
            });
        }).catch(() => {});
    }, [goals]);

    function saveGoals() {
        setGoals(draft);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        setEditing(false);
    }

    return (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>🎯 Неделни цели</h3>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setDraft(goals); setEditing((e) => !e); }}>
                    {editing ? 'Откажи' : '✏️ Постави цели'}
                </button>
            </div>

            {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    <GoalInput label="📱 Макс. screen-time на ден (часа)" value={draft.maxScreenTime}
                               onChange={(v) => setDraft((d) => ({ ...d, maxScreenTime: v }))} min={1} max={12} />
                    <GoalInput label="😴 Мин. сон на ноќ (часа)" value={draft.minSleep}
                               onChange={(v) => setDraft((d) => ({ ...d, minSleep: v }))} min={4} max={12} />
                    <GoalInput label="😊 Мин. расположение (1–5)" value={draft.minMood}
                               onChange={(v) => setDraft((d) => ({ ...d, minMood: v }))} min={1} max={5} />
                    <GoalInput label="📅 Цел: check-in денови во недела" value={draft.checkInDays}
                               onChange={(v) => setDraft((d) => ({ ...d, checkInDays: v }))} min={1} max={7} />
                    <button type="button" className="btn btn-primary btn-sm" onClick={saveGoals}>
                        Зачувај цели
                    </button>
                </div>
            ) : progress ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    <GoalBar label="📱 Screen-time ≤ " target={`${goals.maxScreenTime}ч`}
                             done={progress.screenDays} total={goals.checkInDays}
                             color={progress.screenDays >= goals.checkInDays ? 'var(--color-success)' : 'var(--color-accent)'} />
                    <GoalBar label="😴 Сон ≥ " target={`${goals.minSleep}ч`}
                             done={progress.sleepDays} total={goals.checkInDays}
                             color={progress.sleepDays >= goals.checkInDays ? 'var(--color-success)' : 'var(--color-accent)'} />
                    <GoalBar label="😊 Расположение ≥ " target={`${goals.minMood}/5`}
                             done={progress.moodDays} total={goals.checkInDays}
                             color={progress.moodDays >= goals.checkInDays ? 'var(--color-success)' : 'var(--color-accent)'} />
                    <GoalBar label="📅 Check-in денови" target={`${goals.checkInDays} дена`}
                             done={progress.checkIns} total={goals.checkInDays}
                             color={progress.checkIns >= goals.checkInDays ? 'var(--color-success)' : 'var(--color-primary)'} />
                </div>
            ) : (
                <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
                    Нема записи за оваа недела. Направи check-in за да следиш напредок.
                </p>
            )}
        </div>
    );
}

function GoalBar({ label, target, done, total, color }) {
    const pct = Math.min(100, (done / Math.max(total, 1)) * 100);
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                <span style={{ color: 'var(--color-ink)' }}>{label}<strong>{target}</strong></span>
                <span className="mono" style={{ color, fontWeight: 700 }}>{done}/{total}</span>
            </div>
            <div style={{ height: 8, borderRadius: 'var(--radius-full)', background: 'var(--color-bg-soft)' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 'var(--radius-full)',
                    background: color, transition: 'width 0.4s ease' }} />
            </div>
        </div>
    );
}

function GoalInput({ label, value, onChange, min, max }) {
    return (
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.88rem', color: 'var(--color-ink)' }}>
            {label}
            <input type="number" value={value} min={min} max={max}
                   onChange={(e) => onChange(Number(e.target.value))}
                   style={{ padding: '0.5em 0.8em', borderRadius: 'var(--radius-md)',
                       border: '1.5px solid var(--color-border)', fontFamily: 'inherit',
                       fontSize: '0.95rem', width: 100 }} />
        </label>
    );
}