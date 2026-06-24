import { useState } from 'react';

const CATEGORY_LABELS = {
    digital_detox: { label: 'Дигитален детокс', emoji: '📵' },
    mindfulness: { label: 'Свесност', emoji: '🧘' },
    sleep: { label: 'Сон', emoji: '🌙' },
    social: { label: 'Социјално', emoji: '🤝' },
    study_balance: { label: 'Учење', emoji: '📚' },
};

export default function ChallengeCard({ userChallenge, onComplete, completing }) {
    const challenge = userChallenge.challenges;
    const isCompleted = userChallenge.status === 'completed';
    const meta = CATEGORY_LABELS[challenge?.category] || { label: challenge?.category, emoji: '✨' };
    const [hovered, setHovered] = useState(false);

    const showCheck = isCompleted || hovered || completing;

    return (
        <div
            className="card"
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.9rem',
                opacity: isCompleted ? 0.7 : 1,
            }}
        >
            <button
                type="button"
                onClick={() => !isCompleted && onComplete(userChallenge.id)}
                disabled={isCompleted || completing}
                aria-label={isCompleted ? 'Завршено' : 'Означи како завршено'}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    flexShrink: 0,
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    border: `2px solid ${showCheck ? 'var(--color-success)' : 'var(--color-border)'}`,
                    background: showCheck ? 'var(--color-success)' : 'transparent',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: isCompleted ? 'default' : 'pointer',
                    fontSize: '1rem',
                    transition: 'background 0.15s, border-color 0.15s',
                }}
            >
                {showCheck ? '✓' : ''}
            </button>

            <div style={{ flex: 1 }}>
                <p className="eyebrow" style={{ marginBottom: '0.2rem' }}>
                    {meta.emoji} {meta.label}
                </p>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>{challenge?.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-ink-muted)', marginBottom: '0.3rem' }}>
                    {challenge?.description}
                </p>
                <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-accent)' }}>
          +{challenge?.xp_reward} XP
        </span>
            </div>
        </div>
    );
}