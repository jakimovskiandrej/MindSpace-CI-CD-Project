export default function BadgeGrid({ allBadges = [], earnedBadgeIds = new Set() }) {
  return (
    <div className="grid grid-3">
      {allBadges.map((badge) => {
        const unlocked = earnedBadgeIds.has(badge.id);
        return (
          <div
            key={badge.id}
            className="card"
            style={{
              textAlign: 'center',
              padding: '1.1rem 0.75rem',
              opacity: unlocked ? 1 : 0.55,
            }}
            title={badge.description}
          >
            <div
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 0.6rem',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.6rem',
                background: unlocked ? 'var(--color-accent-soft)' : 'var(--color-bg-soft)',
                border: `2px solid ${unlocked ? 'var(--color-accent)' : 'var(--color-border)'}`,
                filter: unlocked ? 'none' : 'grayscale(0.6)',
              }}
            >
              {unlocked ? badge.icon_emoji : '🔒'}
            </div>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.15rem' }}>{badge.title}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)', margin: 0 }}>
              {badge.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
