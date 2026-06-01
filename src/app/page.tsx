'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PublicBrandNav from '@/components/brand/PublicBrandNav';
import styles from './page.module.css';

const BOARDS = [
  { id: 'running', emoji: '🏃', label: 'Running', color: '#FC0230' },
  { id: 'gym', emoji: '💪', label: 'Gym', color: '#FC0230' },
  { id: 'swimming', emoji: '🏊', label: 'Natación', color: '#06B6D4' },
  { id: 'yoga', emoji: '🧘', label: 'Yoga', color: '#10B981' },
  { id: 'cycling', emoji: '🚴', label: 'Ciclismo', color: '#3B82F6' },
  { id: 'pets', emoji: '🐾', label: 'Mascotas', color: '#F59E0B' },
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

const SPONSOR_GRAY = '#64748b';
const SPONSOR_GRAY_LIGHT = '#94a3b8';

function LogoBingo() {
  return (
    <svg width="72" height="28" viewBox="0 0 72 28" fill="none" aria-hidden>
      <rect x="0" y="4" width="20" height="20" rx="4" fill={SPONSOR_GRAY} />
      <rect x="2" y="6" width="7" height="7" rx="1.5" fill="#1e293b" />
      <rect x="11" y="6" width="7" height="7" rx="1.5" fill="#1e293b" />
      <rect x="2" y="15" width="7" height="7" rx="1.5" fill="#1e293b" />
      <rect x="11" y="15" width="3" height="7" rx="1.5" fill="#1e293b" />
      <text x="26" y="19" fontFamily="'DM Sans',sans-serif" fontSize="13" fontWeight="700" fill={SPONSOR_GRAY_LIGHT} letterSpacing="-0.5">
        BINGO
      </text>
    </svg>
  );
}

function LogoStrava() {
  return (
    <svg width="80" height="28" viewBox="0 0 80 28" fill="none" aria-hidden>
      <path d="M14 4L20 16H17L14 10L11 16H8L14 4Z" fill={SPONSOR_GRAY} />
      <path d="M20 16L23 22H26L20 10L17 16H20Z" fill={SPONSOR_GRAY_LIGHT} />
      <text x="30" y="19" fontFamily="'DM Sans',sans-serif" fontSize="13" fontWeight="700" fill={SPONSOR_GRAY_LIGHT} letterSpacing="-0.3">
        STRAVA
      </text>
    </svg>
  );
}

function LogoSportline() {
  return (
    <svg width="100" height="28" viewBox="0 0 100 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="10" stroke={SPONSOR_GRAY} strokeWidth="2" fill="none" />
      <path d="M9 14 Q14 8 19 14 Q14 20 9 14Z" fill={SPONSOR_GRAY} />
      <text x="30" y="19" fontFamily="'DM Sans',sans-serif" fontSize="13" fontWeight="600" fill={SPONSOR_GRAY_LIGHT} letterSpacing="-0.3">
        SPORTLINE
      </text>
    </svg>
  );
}

function LogoNike() {
  return (
    <svg width="56" height="28" viewBox="0 0 56 28" fill="none" aria-hidden>
      <path d="M4 20C4 20 28 4 44 8C52 10 44 18 36 16C28 14 20 18 20 18L4 20Z" fill={SPONSOR_GRAY} />
    </svg>
  );
}

function LogoGarmin() {
  return (
    <svg width="84" height="28" viewBox="0 0 84 28" fill="none" aria-hidden>
      <rect x="2" y="8" width="18" height="12" rx="6" stroke={SPONSOR_GRAY} strokeWidth="2" fill="none" />
      <circle cx="11" cy="14" r="3" fill={SPONSOR_GRAY} />
      <text x="26" y="19" fontFamily="'DM Sans',sans-serif" fontSize="13" fontWeight="600" fill={SPONSOR_GRAY_LIGHT} letterSpacing="-0.3">
        GARMIN
      </text>
    </svg>
  );
}

function LogoDecathlon() {
  return (
    <svg width="106" height="28" viewBox="0 0 106 28" fill="none" aria-hidden>
      <rect x="2" y="9" width="18" height="10" rx="2" fill={SPONSOR_GRAY} />
      <rect x="6" y="12" width="10" height="4" rx="1" fill="#1e293b" />
      <text x="26" y="19" fontFamily="'DM Sans',sans-serif" fontSize="13" fontWeight="600" fill={SPONSOR_GRAY_LIGHT} letterSpacing="-0.3">
        DECATHLON
      </text>
    </svg>
  );
}

const SPONSORS = [
  { id: 'bingo', Logo: LogoBingo },
  { id: 'strava', Logo: LogoStrava },
  { id: 'sportline', Logo: LogoSportline },
  { id: 'nike', Logo: LogoNike },
  { id: 'garmin', Logo: LogoGarmin },
  { id: 'decathlon', Logo: LogoDecathlon },
];

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeBoard, setActiveBoard] = useState(BOARDS[0]);
  const [completed, setCompleted] = useState<Set<number>>(new Set([4]));
  const [showBingo, setShowBingo] = useState(false);

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
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleBoardChange = (board: (typeof BOARDS)[0]) => {
    setActiveBoard(board);
    setCompleted(new Set([4]));
    setShowBingo(false);
  };

  const total = 8;
  const done = Math.max(0, completed.size - 1);
  const pct = Math.round((done / total) * 100);
  const c = activeBoard.color;

  const marqueeItems = [...SPONSORS, ...SPONSORS, ...SPONSORS];

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      <PublicBrandNav>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="rounded-lg border border-slate-700 px-4 py-1.5 text-[13px] font-medium text-slate-300 transition-colors hover:border-primary-500 hover:text-primary-400"
        >
          Iniciar sesión
        </button>
      </PublicBrandNav>

      <div className="border-b border-slate-800 bg-slate-900/80 py-3.5 overflow-hidden">
        <div className="flex items-center overflow-hidden">
          <div className="shrink-0 whitespace-nowrap border-r border-slate-700 mr-8 pl-[clamp(1.25rem,5vw,3rem)] pr-5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Sponsors
          </div>
          <div className="flex-1 overflow-hidden">
            <div className={styles.marqueeTrack}>
              {marqueeItems.map((s, i) => (
                <div key={`${s.id}-${i}`} className={styles.sponsorItem}>
                  <s.Logo />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-[960px] grid-cols-1 items-center gap-[clamp(2rem,5vw,4rem)] px-[clamp(1.25rem,5vw,3rem)] py-[clamp(2rem,6vw,4rem)] sm:grid-cols-[minmax(280px,1fr)_minmax(280px,1fr)]">
        <div className={`${styles.fadeUp} flex flex-col gap-6`}>
          <div
            className="inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={{
              background: `${c}12`,
              borderColor: `${c}28`,
              color: c,
            }}
          >
            <div className="h-1.5 w-1.5 rounded-full transition-colors" style={{ background: c }} />
            Bingo deportivo
          </div>

          <div>
            <h1 className="mb-3 text-[clamp(26px,4vw,40px)] font-bold leading-tight tracking-tight text-white">
              Completa retos.
              <br />
              <span className="transition-colors" style={{ color: c }}>
                Gana el bingo.
              </span>
            </h1>
            <p className="m-0 text-[15px] leading-relaxed text-slate-400">
              Elige tu tablero, supera cada desafío deportivo y sé el primero en completar la cuadrícula. Valida con foto o
              Strava.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { v: '2,450', l: 'Puntos' },
              { v: '12', l: 'Nivel' },
              { v: '15', l: 'Retos' },
            ].map((s) => (
              <div key={s.l} className="rounded-[10px] border border-slate-700 bg-slate-800 px-2.5 py-3 text-center">
                <div className="text-lg font-bold tracking-tight text-white">{s.v}</div>
                <div className="mt-0.5 text-[11px] text-slate-500">{s.l}</div>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tableros</p>
            <div className="flex flex-wrap gap-1.5">
              {BOARDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={styles.boardBtn}
                  onClick={() => handleBoardChange(b)}
                  style={{
                    fontSize: 11,
                    padding: '5px 11px',
                    borderRadius: 20,
                    fontWeight: 500,
                    transition: 'all .2s',
                    background: activeBoard.id === b.id ? b.color : 'transparent',
                    color: activeBoard.id === b.id ? '#fff' : '#94a3b8',
                    border: activeBoard.id === b.id ? `1px solid ${b.color}` : '1px solid #334155',
                  }}
                >
                  {b.emoji} {b.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full cursor-pointer rounded-xl border-none px-6 py-3.5 text-sm font-semibold tracking-tight text-white transition-all hover:-translate-y-0.5"
            style={{ background: c }}
          >
            Comenzar — es gratis →
          </button>
        </div>

        <div className={`${styles.fadeUpDelayed} flex flex-col items-center gap-3.5`}>
          <div
            className="grid w-full max-w-[280px] grid-cols-3 gap-1.5 rounded-2xl p-1.5 transition-colors"
            style={{ background: c }}
          >
            {CELLS.map((cell, i) => {
              const isDone = completed.has(i);
              return (
                <div
                  key={i}
                  className={styles.cellItem}
                  onClick={() => toggleCell(i)}
                  style={{
                    background: isDone ? 'rgba(255,255,255,0.25)' : 'rgba(243,246,251,0.18)',
                    borderRadius: 10,
                    aspectRatio: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    cursor: cell.special ? 'default' : 'pointer',
                    outline: isDone && !cell.special ? '2px solid rgba(255,255,255,0.4)' : 'none',
                    outlineOffset: -2,
                  }}
                >
                  {isDone && !cell.special ? (
                    <CheckIcon />
                  ) : (
                    <>
                      <span className="text-lg leading-none">{cell.emoji}</span>
                      <span className="text-center text-[8px] leading-tight text-white/75">{cell.label}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-full max-w-[280px] rounded-[10px] border border-slate-700 bg-slate-800 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {done} / {total} completados
              </span>
              <span className="text-xs font-semibold transition-colors" style={{ color: c }}>
                {pct}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{ background: c, width: `${pct}%` }}
              />
            </div>
          </div>

          {showBingo && (
            <div
              className={`rounded-xl px-5 py-2.5 text-center text-[13px] font-semibold text-white transition-colors ${styles.floatBadge}`}
              style={{ background: c }}
            >
              ¡BINGO! +2,450 pts 🏆
            </div>
          )}

          <p className="m-0 text-center text-[11px] text-slate-500">Toca las celdas para simular</p>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        BOX Challenge · Todos los retos, un tablero.
      </footer>
    </div>
  );
}
