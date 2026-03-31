'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const BOARDS = [
  { id: 'running',  emoji: '🏃', label: 'Running',  color: '#FC0230' },
  { id: 'gym',      emoji: '💪', label: 'Gym',       color: '#FC0230' },
  { id: 'swimming', emoji: '🏊', label: 'Natación',  color: '#06B6D4' },
  { id: 'yoga',     emoji: '🧘', label: 'Yoga',      color: '#10B981' },
  { id: 'cycling',  emoji: '🚴', label: 'Ciclismo',  color: '#3B82F6' },
  { id: 'pets',     emoji: '🐾', label: 'Mascotas',  color: '#F59E0B' },
];

const CELLS = [
  { emoji: '🏃', label: '5km' },
  { emoji: '💪', label: 'Flexiones' },
  { emoji: '🧘', label: 'Yoga' },
  { emoji: '🚴', label: 'Ciclismo' },
  { emoji: '⭐', label: 'Libre', special: true },
  { emoji: '🏊', label: 'Natación' },
  { emoji: '🔥', label: 'HIIT' },
  { emoji: '🐾', label: 'Mascota' },
  { emoji: '🏔️', label: 'Trail' },
];

// SVG logos en escala de grises
function LogoBingo() {
  return (
    <svg width="72" height="28" viewBox="0 0 72 28" fill="none">
      <rect x="0" y="4" width="20" height="20" rx="4" fill="#C8C6BF"/>
      <rect x="2" y="6" width="7" height="7" rx="1.5" fill="#FAFAF9"/>
      <rect x="11" y="6" width="7" height="7" rx="1.5" fill="#FAFAF9"/>
      <rect x="2" y="15" width="7" height="7" rx="1.5" fill="#FAFAF9"/>
      <rect x="11" y="15" width="3" height="7" rx="1.5" fill="#FAFAF9"/>
      <text x="26" y="19" fontFamily="'DM Sans',sans-serif" fontSize="13" fontWeight="700" fill="#A8A69F" letterSpacing="-0.5">BINGO</text>
    </svg>
  );
}

function LogoStrava() {
  return (
    <svg width="80" height="28" viewBox="0 0 80 28" fill="none">
      <path d="M14 4L20 16H17L14 10L11 16H8L14 4Z" fill="#C8C6BF"/>
      <path d="M20 16L23 22H26L20 10L17 16H20Z" fill="#B0AEA7"/>
      <text x="30" y="19" fontFamily="'DM Sans',sans-serif" fontSize="13" fontWeight="700" fill="#A8A69F" letterSpacing="-0.3">STRAVA</text>
    </svg>
  );
}

function LogoSportline() {
  return (
    <svg width="100" height="28" viewBox="0 0 100 28" fill="none">
      <circle cx="14" cy="14" r="10" stroke="#C8C6BF" strokeWidth="2" fill="none"/>
      <path d="M9 14 Q14 8 19 14 Q14 20 9 14Z" fill="#C8C6BF"/>
      <text x="30" y="19" fontFamily="'DM Sans',sans-serif" fontSize="13" fontWeight="600" fill="#A8A69F" letterSpacing="-0.3">SPORTLINE</text>
    </svg>
  );
}

function LogoNike() {
  return (
    <svg width="56" height="28" viewBox="0 0 56 28" fill="none">
      <path d="M4 20C4 20 28 4 44 8C52 10 44 18 36 16C28 14 20 18 20 18L4 20Z" fill="#C8C6BF"/>
    </svg>
  );
}

function LogoGarmin() {
  return (
    <svg width="84" height="28" viewBox="0 0 84 28" fill="none">
      <rect x="2" y="8" width="18" height="12" rx="6" stroke="#C8C6BF" strokeWidth="2" fill="none"/>
      <circle cx="11" cy="14" r="3" fill="#C8C6BF"/>
      <text x="26" y="19" fontFamily="'DM Sans',sans-serif" fontSize="13" fontWeight="600" fill="#A8A69F" letterSpacing="-0.3">GARMIN</text>
    </svg>
  );
}

function LogoDecathlon() {
  return (
    <svg width="106" height="28" viewBox="0 0 106 28" fill="none">
      <rect x="2" y="9" width="18" height="10" rx="2" fill="#C8C6BF"/>
      <rect x="6" y="12" width="10" height="4" rx="1" fill="#FAFAF9"/>
      <text x="26" y="19" fontFamily="'DM Sans',sans-serif" fontSize="13" fontWeight="600" fill="#A8A69F" letterSpacing="-0.3">DECATHLON</text>
    </svg>
  );
}

const SPONSORS = [
  { id: 'bingo',      Logo: LogoBingo },
  { id: 'strava',     Logo: LogoStrava },
  { id: 'sportline',  Logo: LogoSportline },
  { id: 'nike',       Logo: LogoNike },
  { id: 'garmin',     Logo: LogoGarmin },
  { id: 'decathlon',  Logo: LogoDecathlon },
];

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeBoard, setActiveBoard] = useState(BOARDS[0]);
  const [completed, setCompleted] = useState<Set<number>>(new Set([4]));
  const [showBingo, setShowBingo] = useState(false);

  // Already logged in → skip landing
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.replace(session.user.role === 'ADMIN' ? '/admin' : '/home');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (completed.size === 9) {
      const t = setTimeout(() => setShowBingo(true), 400);
      return () => clearTimeout(t);
    }
    setShowBingo(false);
  }, [completed]);

  const toggleCell = (i: number) => {
    if (CELLS[i].special) return;
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleBoardChange = (board: typeof BOARDS[0]) => {
    setActiveBoard(board);
    setCompleted(new Set([4]));
    setShowBingo(false);
  };

  const total = 8;
  const done = Math.max(0, completed.size - 1);
  const pct = Math.round((done / total) * 100);
  const c = activeBoard.color;

  if (status === 'loading') return null;

  // Duplicar sponsors para loop continuo
  const marqueeItems = [...SPONSORS, ...SPONSORS, ...SPONSORS];

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF9', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* ── Estilos globales ─────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { font-family: inherit; }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes floatBadge {
          0%,100% { transform: translateY(0) scale(1); }
          50%     { transform: translateY(-5px) scale(1.02); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .marquee-track {
          display: flex;
          align-items: center;
          gap: 56px;
          animation: marquee 22s linear infinite;
          width: max-content;
        }
        .marquee-track:hover { animation-play-state: paused; }
        .sponsor-item {
          display: flex;
          align-items: center;
          opacity: 0.7;
          transition: opacity .2s;
          flex-shrink: 0;
        }
        .sponsor-item:hover { opacity: 1; }
        .board-btn { border: none; background: transparent; cursor: pointer; font-family: inherit; }
        .cell-item { transition: background .2s, transform .15s, outline .15s; }
        .cell-item:hover { transform: scale(1.06); }
      `}</style>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1.25rem,5vw,3rem)', height: 60,
        borderBottom: '1px solid #EEECEA', background: '#FAFAF9',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: c,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .3s',
          }}>
            <span style={{ fontSize: 14 }}>🏆</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1C1C1A', letterSpacing: '-.02em' }}>
            SportBingo
          </span>
        </div>
        <button
          onClick={() => router.push('/login')}
          style={{
            background: 'transparent', border: '1px solid #E5E3DC',
            borderRadius: 8, padding: '7px 16px', fontSize: 13,
            fontWeight: 500, color: '#444441', cursor: 'pointer',
            transition: 'border-color .2s, color .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = c; e.currentTarget.style.color = c; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E3DC'; e.currentTarget.style.color = '#444441'; }}
        >
          Iniciar sesión
        </button>
      </nav>

      {/* ── Banda de patrocinadores ──────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid #EEECEA',
        padding: '14px 0',
        overflow: 'hidden',
        background: '#F7F6F2',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <div
            style={{
              fontSize: 10, fontWeight: 600, color: '#B8B6AF',
              letterSpacing: '.08em', textTransform: 'uppercase',
              padding: '0 20px 0 clamp(1.25rem,5vw,3rem)',
              flexShrink: 0, whiteSpace: 'nowrap',
              borderRight: '1px solid #E5E3DC', marginRight: 32,
            }}
          >
            Sponsors
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div className="marquee-track">
              {marqueeItems.map((s, i) => (
                <div key={`${s.id}-${i}`} className="sponsor-item">
                  <s.Logo />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <main style={{
        maxWidth: 960, margin: '0 auto',
        padding: 'clamp(2rem,6vw,4rem) clamp(1.25rem,5vw,3rem)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'clamp(2rem,5vw,4rem)',
        alignItems: 'center',
      }}>

        {/* ── Columna izquierda ──────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeUp .5s ease both' }}>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${c}12`, border: `1px solid ${c}28`,
            borderRadius: 20, padding: '4px 12px', width: 'fit-content',
            transition: 'background .3s, border-color .3s',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, transition: 'background .3s' }}/>
            <span style={{ fontSize: 12, fontWeight: 500, color: c, transition: 'color .3s' }}>
              Bingo deportivo
            </span>
          </div>

          <div>
            <h1 style={{
              fontSize: 'clamp(26px,4vw,40px)', fontWeight: 700,
              lineHeight: 1.2, letterSpacing: '-.03em',
              color: '#1C1C1A', margin: '0 0 12px',
            }}>
              Completa retos.<br/>
              <span style={{ color: c, transition: 'color .3s' }}>Gana el bingo.</span>
            </h1>
            <p style={{ fontSize: 15, color: '#6B6B67', lineHeight: 1.65, margin: 0 }}>
              Elige tu tablero, supera cada desafío deportivo y sé el primero
              en completar la cuadrícula. Valida con foto o Strava.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[{ v: '2,450', l: 'Puntos' }, { v: '12', l: 'Nivel' }, { v: '15', l: 'Retos' }].map(s => (
              <div key={s.l} style={{
                background: '#F4F3EE', borderRadius: 10, padding: '12px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1C1C1A', letterSpacing: '-.02em' }}>{s.v}</div>
                <div style={{ fontSize: 11, color: '#9B9B95', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Selector de tableros */}
          <div>
            <p style={{ fontSize: 11, color: '#9B9B95', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Tableros
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {BOARDS.map(b => (
                <button
                  key={b.id}
                  className="board-btn"
                  onClick={() => handleBoardChange(b)}
                  style={{
                    fontSize: 11, padding: '5px 11px', borderRadius: 20,
                    fontWeight: 500, transition: 'all .2s',
                    background: activeBoard.id === b.id ? b.color : 'transparent',
                    color: activeBoard.id === b.id ? '#fff' : '#6B6B67',
                    border: activeBoard.id === b.id ? `1px solid ${b.color}` : '1px solid #E5E3DC',
                  }}
                >
                  {b.emoji} {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push('/login')}
            style={{
              background: c, color: '#fff', border: 'none',
              borderRadius: 12, padding: '14px 24px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '-.01em', width: '100%',
              transition: 'background .3s, transform .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Comenzar — es gratis →
          </button>
        </div>

        {/* ── Columna derecha: tablero ───────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          animation: 'fadeUp .5s ease .1s both',
        }}>
          <div style={{
            background: c, borderRadius: 16, padding: 7,
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6,
            width: '100%', maxWidth: 280, transition: 'background .3s',
          }}>
            {CELLS.map((cell, i) => {
              const isDone = completed.has(i);
              return (
                <div
                  key={i}
                  className="cell-item"
                  onClick={() => toggleCell(i)}
                  style={{
                    background: isDone ? 'rgba(255,255,255,0.25)' : 'rgba(243,246,251,0.18)',
                    borderRadius: 10, aspectRatio: '1',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 3,
                    cursor: cell.special ? 'default' : 'pointer',
                    outline: isDone && !cell.special ? '2px solid rgba(255,255,255,0.4)' : 'none',
                    outlineOffset: -2,
                  }}
                >
                  {isDone && !cell.special ? (
                    <CheckIcon />
                  ) : (
                    <>
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{cell.emoji}</span>
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 1.2 }}>
                        {cell.label}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Barra progreso */}
          <div style={{ width: '100%', maxWidth: 280, background: '#F4F3EE', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#6B6B67' }}>{done} / {total} completados</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: c, transition: 'color .3s' }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: '#E5E3DC', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: c, borderRadius: 99,
                width: `${pct}%`, transition: 'width .4s ease, background .3s',
              }}/>
            </div>
          </div>

          {/* Badge BINGO */}
          {showBingo && (
            <div style={{
              background: c, color: '#fff', borderRadius: 12,
              padding: '10px 20px', fontSize: 13, fontWeight: 600,
              textAlign: 'center', animation: 'floatBadge 2s ease-in-out infinite',
              transition: 'background .3s',
            }}>
              ¡BINGO! +2,450 pts 🏆
            </div>
          )}

          <p style={{ fontSize: 11, color: '#9B9B95', textAlign: 'center', margin: 0 }}>
            Toca las celdas para simular
          </p>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer style={{
        textAlign: 'center', padding: '2rem',
        borderTop: '1px solid #EEECEA',
        fontSize: 12, color: '#9B9B95',
      }}>
        SportBingo · Todos los retos, un tablero.
      </footer>
    </div>
  );
}
