const XP_PER_LEVEL = 100;

export default function XPRing({ xp = 0, level = 1, size = 84, avatarEmoji = '🌱' }) {
  const progressInLevel = xp % XP_PER_LEVEL;
  const pct = progressInLevel / XP_PER_LEVEL;

  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          flexDirection: 'column',
        }}
      >
        <span style={{ fontSize: size * 0.32, lineHeight: 1 }}>{avatarEmoji}</span>
      </div>
      <div
        className="mono"
        style={{
          position: 'absolute',
          bottom: -22,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '0.7rem',
          color: 'var(--color-ink-muted)',
          whiteSpace: 'nowrap',
        }}
      >
        Ниво {level} · {progressInLevel}/{XP_PER_LEVEL} XP
      </div>
    </div>
  );
}
