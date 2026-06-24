const MOODS = [
  { score: 1, emoji: '😔', label: 'Тажен' },
  { score: 2, emoji: '😕', label: 'Не баш' },
  { score: 3, emoji: '😐', label: 'Во ред' },
  { score: 4, emoji: '🙂', label: 'Добро' },
  { score: 5, emoji: '😄', label: 'Одлично' },
];

export default function MoodEmojiPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
      {MOODS.map((m) => {
        const selected = value === m.score;
        return (
          <button
            key={m.score}
            type="button"
            onClick={() => onChange(m.score)}
            aria-pressed={selected}
            aria-label={m.label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.85rem 0.25rem',
              borderRadius: 'var(--radius-md)',
              border: selected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
              background: selected ? 'var(--color-primary-soft)' : 'var(--color-surface)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, border-color 0.15s ease',
              transform: selected ? 'scale(1.06)' : 'scale(1)',
            }}
          >
            <span style={{ fontSize: '1.9rem', lineHeight: 1 }}>{m.emoji}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
