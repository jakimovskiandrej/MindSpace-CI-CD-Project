export default function RangeSlider({ label, value, onChange, min = 0, max = 12, step = 0.5, unit = 'ч', accentColor }) {
  const pct= ((value - min) / (max - min)) * 100;
  const color= accentColor || 'var(--color-primary)';

  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <label style={{ fontWeight: 600, fontSize: '0.92rem' }}>{label}</label>
        <span className="mono" style={{ fontSize: '0.92rem', color }}>
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: color,
          height: '6px',
          background: `linear-gradient(to right, ${color} ${pct}%, var(--color-bg-soft) ${pct}%)`,
          borderRadius: 'var(--radius-full)',
          appearance: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
