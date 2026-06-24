import { useState, useEffect } from 'react';

const STEPS = [
    {
        title: 'Добредојде во MindSpace 🌿',
        text: 'Оваа апликација ти помага да го следиш своето расположение, screen-time и стрес. Ќе те водиме низ главните функции.',
        icon: '👋',
    },
    {
        title: 'Дневен Check-in',
        text: 'Секој ден заврши го check-in-от — 2 минути за да запишеш расположение, колку си бил на екран и колку си спиел. Приватно е — само ти го гледаш.',
        icon: '📝',
    },
    {
        title: 'Аналитика и трендови',
        text: 'Следи ги своите трендови во Аналитика — графикони на расположение, сон и стрес-денови, плус PDF извештај.',
        icon: '📊',
    },
    {
        title: 'Предизвици и XP',
        text: 'На Почетна добиваш персонализирани предизвици базирани на твоите записи. Заврши ги и освојувај XP, нивоа и беџови.',
        icon: '🏆',
    },
    {
        title: 'SOS копче за дишење',
        text: 'Ако се чувствуваш преоптоварено, притисни го зеленото SOS копче (долу десно) за 5-минутна вежба за дишење.',
        icon: '🫶',
    },
    {
        title: 'Спремен си! 🎉',
        text: 'Тоа е сè! Почни со твојот прв check-in денес. Можеш повторно да го видиш овој водич во Поставки.',
        icon: '🚀',
    },
];

const STORAGE_KEY = 'ms-onboarding-done';

export default function OnboardingTour({ forceShow = false, onClose }) {
    const [step, setStep] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (forceShow || !localStorage.getItem(STORAGE_KEY)) {
            setVisible(true);
        }
    }, [forceShow]);

    function handleNext() {
        if (step < STEPS.length - 1) {
            setStep((s) => s + 1);
        } else {
            handleClose();
        }
    }

    function handleClose() {
        localStorage.setItem(STORAGE_KEY, '1');
        setVisible(false);
        onClose?.();
    }

    if (!visible) return null;

    const current = STEPS[step];

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(15, 26, 22, 0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
            <div style={{
                background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 2rem', maxWidth: 420, width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                textAlign: 'center',
            }}>
                <div style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '1rem' }}>
                    {current.icon}
                </div>

                <h2 style={{ marginTop: 0, marginBottom: '0.6rem', fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                    {current.title}
                </h2>

                <p style={{ color: 'var(--color-ink-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
                    {current.text}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}>
                    {STEPS.map((_, i) => (
                        <div key={i} style={{
                            width: i === step ? 20 : 8, height: 8,
                            borderRadius: 'var(--radius-full)',
                            background: i === step ? 'var(--color-primary)' : 'var(--color-border)',
                            transition: 'width 0.2s, background 0.2s',
                        }} />
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    {step > 0 && (
                        <button type="button" className="btn btn-ghost btn-sm"
                                onClick={() => setStep((s) => s - 1)}>
                            ← Назад
                        </button>
                    )}
                    <button type="button" className="btn btn-primary"
                            onClick={handleNext} style={{ minWidth: 140 }}>
                        {step === STEPS.length - 1 ? 'Започни! 🚀' : 'Следно →'}
                    </button>
                </div>

                {step < STEPS.length - 1 && (
                    <button type="button" onClick={handleClose}
                            style={{ marginTop: '1rem', background: 'none', border: 'none',
                                cursor: 'pointer', fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>
                        Прескокни го водичот
                    </button>
                )}
            </div>
        </div>
    );
}