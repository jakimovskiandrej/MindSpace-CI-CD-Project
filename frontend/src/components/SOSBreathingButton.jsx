import { useEffect, useRef, useState } from 'react';

const PHASES = [
  { key: 'inhale', label: 'Вдиши...', seconds: 4 },
  { key: 'hold1', label: 'Задржи...', seconds: 4 },
  { key: 'exhale', label: 'Издиши...', seconds: 4 },
  { key: 'hold2', label: 'Задржи...', seconds: 4 },
];

export default function SOSBreathingButton() {
  const [open, setOpen] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cyclesDone, setCyclesDone] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    timeoutRef.current = setTimeout(() => {
      setPhaseIndex((prev) => {
        const next = (prev + 1) % PHASES.length;
        if (next === 0) setCyclesDone((c) => c + 1);
        return next;
      });
    }, PHASES[phaseIndex].seconds * 1000);

    return () => clearTimeout(timeoutRef.current);
  }, [open, phaseIndex]);

  function handleOpen() {
    setPhaseIndex(0);
    setCyclesDone(0);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    clearTimeout(timeoutRef.current);
  }

  const phase = PHASES[phaseIndex];
  const isExpand = phase.key === 'inhale' || phase.key === 'hold1';

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="btn"
        style={{
          position: 'fixed',
          right: 'clamp(1rem, 3vw, 2.25rem)',
          bottom: 'clamp(1rem, 3vw, 2.25rem)',
          background: 'var(--color-alert)',
          color: '#fff',
          width: 64,
          height: 64,
          borderRadius: '50%',
          fontSize: '1.6rem',
          boxShadow: 'var(--shadow-lift)',
          zIndex: 40,
        }}
        aria-label="Отвори SOS вежба за дишење"
        title="Се чувствуваш стресно? Кликни за брза вежба за дишење."
      >
        🫶
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Вежба за дишење"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 65, 61, 0.55)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 50,
            padding: '1.5rem',
          }}
          onClick={handleClose}
        >
          <div
            className="card"
            style={{ textAlign: 'center', maxWidth: 380, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow" style={{ marginBottom: '0.25rem' }}>SOS пауза</p>
            <h3 style={{ marginBottom: '0.25rem' }}>Box Breathing</h3>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
              Следи го кругот. 4 секунди по фаза. Заврши {cyclesDone} {cyclesDone === 1 ? 'круг' : 'круга'}.
            </p>

            <div style={{ display: 'grid', placeItems: 'center', margin: '1.75rem 0' }}>
              <div
                aria-hidden="true"
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 30%, var(--color-primary-soft), var(--color-primary))',
                  transition: `transform ${phase.seconds}s ease-in-out`,
                  transform: isExpand ? 'scale(1)' : 'scale(0.55)',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: 'var(--shadow-lift)',
                }}
              >
                <span style={{ color: '#fff', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                  {phase.label}
                </span>
              </div>
            </div>

            <button type="button" className="btn btn-ghost" onClick={handleClose}>
              Готово, се чувствувам подобро
            </button>
          </div>
        </div>
      )}
    </>
  );
}
