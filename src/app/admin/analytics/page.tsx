'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Period = '7d' | '30d' | '90d';

interface AnalyticsResponse {
  period: Period;
  kpis: {
    activeUsers: number;
    completedChallenges: number;
    retentionRate: number;
    totalPoints: number;
  };
  topBoards: Array<{
    id: string;
    title: string;
    emoji: string;
    color: string;
    participantCount: number;
    pct: number;
  }>;
  topUsers: Array<{
    name: string;
    points: number;
    category: string;
    color: string;
  }>;
  dailySessions: Array<{ label: string; count: number }>;
  hourlyActivity: Array<{ label: string; count: number }>;
  categoryDistribution: Array<{ category: string; count: number; color: string }>;
  heatmap: number[];
  locationRegions: Array<{ name: string; users: number }>;
  locationDots: Array<{ latitude: number; longitude: number; count: number }>;
  conversion: {
    startedBoards: number;
    completedBoards: number;
    rate: number;
  };
}

const HEAT_PALETTE = ['#1E2535', '#7F1D1D', '#991B1B', '#DC2626', '#FC0230', '#FF5327'];
const MEDALS = ['🥇', '🥈', '🥉'];

function formatCompact(value: number) {
  return value.toLocaleString('es-CO');
}

function heatColor(value: number, max: number) {
  if (max <= 0) return HEAT_PALETTE[0];
  const index = Math.min(HEAT_PALETTE.length - 1, Math.floor((value / max) * HEAT_PALETTE.length));
  return HEAT_PALETTE[index];
}

function mapDotPosition(latitude: number, longitude: number) {
  const left = ((longitude + 180) / 360) * 100;
  const top = ((90 - latitude) / 180) * 100;
  return {
    left: `${Math.max(5, Math.min(95, left))}%`,
    top: `${Math.max(5, Math.min(95, top))}%`,
  };
}

function KpiCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 sm:p-4 transition-all duration-300 hover:border-slate-600/70">
      <div className="text-xs text-slate-500 mb-1.5">{label}</div>
      <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{value}</div>
      <div className="text-xs mt-1 text-green-400">{delta}</div>
    </div>
  );
}

function SkeletonPanel({ className = '' }: { className?: string }) {
  return <div className={`rounded-xl border border-slate-700/40 bg-slate-800/40 animate-pulse ${className}`} />;
}

function SkeletonDashboard() {
  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <SkeletonPanel className="h-7 w-44" />
          <SkeletonPanel className="h-4 w-72 max-w-[80vw]" />
        </div>
        <div className="flex gap-1.5 w-full sm:w-auto">
          <SkeletonPanel className="h-8 flex-1 sm:w-14" />
          <SkeletonPanel className="h-8 flex-1 sm:w-14" />
          <SkeletonPanel className="h-8 flex-1 sm:w-14" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <SkeletonPanel key={idx} className="h-24" />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SkeletonPanel className="h-64" />
        <SkeletonPanel className="h-64" />
        <SkeletonPanel className="h-64" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SkeletonPanel className="h-96" />
        <SkeletonPanel className="h-96" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SkeletonPanel className="h-72" />
        <SkeletonPanel className="h-72" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SkeletonPanel className="xl:col-span-2 h-52" />
        <SkeletonPanel className="h-52" />
      </div>
    </div>
  );
}

function ChartsPanel({ analytics }: { analytics: AnalyticsResponse }) {
  const catRef = useRef<HTMLCanvasElement>(null);
  const sessRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mounted = true;
    let script: HTMLScriptElement | null = null;
    let categoryChart: { destroy: () => void } | null = null;
    let sessionsChart: { destroy: () => void } | null = null;

    const drawCharts = () => {
      const Chart = (window as Window & { Chart?: any }).Chart;
      if (!Chart || !mounted) return;

      if (catRef.current) {
        categoryChart = new Chart(catRef.current, {
          type: 'doughnut',
          data: {
            labels: analytics.categoryDistribution.map((item) => item.category),
            datasets: [
              {
                data: analytics.categoryDistribution.map((item) => item.count),
                backgroundColor: analytics.categoryDistribution.map((item) => item.color),
                borderWidth: 0,
                hoverOffset: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: { legend: { display: false } },
          },
        });
      }

      if (sessRef.current) {
        sessionsChart = new Chart(sessRef.current, {
          type: 'bar',
          data: {
            labels: analytics.dailySessions.map((item) => item.label),
            datasets: [
              {
                label: 'Sesiones',
                data: analytics.dailySessions.map((item) => item.count),
                backgroundColor: '#FC023055',
                borderColor: '#FC0230',
                borderWidth: 1.5,
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } },
              y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1E2535' } },
            },
          },
        });
      }
    };

    if ((window as Window & { Chart?: any }).Chart) {
      drawCharts();
    } else {
      script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      script.onload = drawCharts;
      document.head.appendChild(script);
    }

    return () => {
      mounted = false;
      categoryChart?.destroy();
      sessionsChart?.destroy();
      if (script?.parentNode) script.parentNode.removeChild(script);
    };
  }, [analytics]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 mb-3">Categorias mas activas</p>
        <div className="relative" style={{ height: 160 }}>
          <canvas ref={catRef} />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {analytics.categoryDistribution.map((item) => (
            <span key={item.category} className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-sm" style={{ background: item.color }} />
              {item.category}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 mb-3">Sesiones por dia (ultimos 7d)</p>
        <div className="relative" style={{ height: 160 }}>
          <canvas ref={sessRef} />
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('7d');
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState('Cargando analytics del periodo 7d.');
  const [showFallbackNotice, setShowFallbackNotice] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setLiveMessage(`Cargando analytics del periodo ${period}.`);
    if (period !== '90d') {
      setShowFallbackNotice(false);
    }

    fetch(`/api/admin/analytics?period=${period}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudieron cargar las metricas');
        return response.json() as Promise<AnalyticsResponse>;
      })
      .then((data) => {
        if (!active) return;
        setAnalytics(data);
        setLiveMessage(`Analytics del periodo ${period} cargado.`);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Error inesperado');
        setLiveMessage(`Error al cargar analytics del periodo ${period}.`);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [period]);

  const maxHourly = useMemo(() => Math.max(...(analytics?.hourlyActivity.map((item) => item.count) ?? [0])), [analytics]);
  const maxRegionUsers = useMemo(() => Math.max(...(analytics?.locationRegions.map((item) => item.users) ?? [0])), [analytics]);
  const heatMax = useMemo(() => Math.max(...(analytics?.heatmap ?? [0])), [analytics]);
  const [autoFallbackTried, setAutoFallbackTried] = useState(false);

  useEffect(() => {
    if (!analytics || loading) return;
    if (period === '90d') return;
    if (autoFallbackTried) return;
    if (analytics.locationDots.length > 0) return;

    setAutoFallbackTried(true);
    setLiveMessage('Sin pings en el periodo actual. Cambiando automaticamente a 90d.');
    setShowFallbackNotice(true);
    setPeriod('90d');
  }, [analytics, loading, period, autoFallbackTried]);

  useEffect(() => {
    if (period !== '90d') {
      setAutoFallbackTried(false);
    }
  }, [period]);

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-200">
        <p className="font-semibold">No se pudo cargar analytics.</p>
        <p className="text-sm text-red-300/80 mt-1">{error ?? 'Intenta de nuevo en unos segundos.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Analytics del bingo</h1>
          <p className="text-slate-400 text-sm mt-1">Metricas globales de engagement, progresion y distribucion geografica.</p>
          {showFallbackNotice && (
            <p className="mt-2 inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
              Se amplio automaticamente a 90d para mostrar datos geograficos.
            </p>
          )}
        </div>
        <div className="flex gap-1.5 w-full sm:w-auto">
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all flex-1 sm:flex-none ${
                period === p
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Jugadores activos" value={formatCompact(analytics.kpis.activeUsers)} delta="Actividad del periodo seleccionado" />
        <KpiCard label="Retos completados" value={formatCompact(analytics.kpis.completedChallenges)} delta="Retos finalizados por la comunidad" />
        <KpiCard label="Retencion" value={`${analytics.kpis.retentionRate}%`} delta="Usuarios que regresaron del periodo previo" />
        <KpiCard label="Puntos acumulados" value={formatCompact(analytics.kpis.totalPoints)} delta="Suma de puntos en usuarios activos" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 mb-3">Tableros mas jugados</p>
          <div className="space-y-3">
            {analytics.topBoards.length === 0 ? (
              <p className="text-xs text-slate-500">Aun no hay actividad de tableros para este periodo.</p>
            ) : (
              analytics.topBoards.map((board) => (
                <div key={board.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0" style={{ background: `${board.color}22` }}>
                    {board.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-200 mb-1 truncate">{board.title}</div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${board.pct}%`, background: board.color }} />
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-400 w-10 text-right">{board.pct}%</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 mb-3">Ranking semanal</p>
          <div className="divide-y divide-slate-700/30">
            {analytics.topUsers.map((user, index) => {
              const initials = user.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              return (
                <div key={`${user.name}-${index}`} className="flex items-center gap-2.5 py-2">
                  <div className="text-xs w-5 text-center shrink-0 text-slate-500">{index < 3 ? MEDALS[index] : index + 1}</div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `${user.color}22`, color: user.color }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-200 truncate">{user.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{user.category}</div>
                  </div>
                  <div className="text-xs font-bold text-primary-400">{formatCompact(user.points)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 mb-3">Actividad por hora (ultimas 24h)</p>
          <div className="space-y-1.5">
            {analytics.hourlyActivity.map((item) => {
              const pct = maxHourly > 0 ? Math.round((item.count / maxHourly) * 100) : 0;
              return (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="text-xs text-slate-500 w-8 text-right shrink-0">{item.label}</div>
                  <div className="flex-1 h-5 bg-slate-700 rounded overflow-hidden">
                    <div
                      className="h-full rounded flex items-center pl-1.5 text-[10px] font-semibold text-white transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#FC0230,#FF5327)' }}
                    >
                      {item.count > 0 ? item.count : ''}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 w-8 text-right shrink-0">{item.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 mb-3">Distribucion geografica de jugadores</p>
          <div className="relative bg-slate-900 rounded-lg overflow-hidden border border-slate-700/40" style={{ height: 220 }}>
            <svg width="100%" height="220" viewBox="0 0 500 220" className="absolute inset-0" role="img" aria-label="Mapa de fondo">
              <rect width="500" height="220" fill="#111827" rx="8" />

              {/* grid */}
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * 27.5} x2="500" y2={i * 27.5} stroke="#334155" strokeOpacity="0.35" strokeWidth="1" />
              ))}
              {Array.from({ length: 11 }).map((_, i) => (
                <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="220" stroke="#334155" strokeOpacity="0.35" strokeWidth="1" />
              ))}

              {/* continents */}
              <path d="M46 70 Q84 42 138 62 Q162 52 186 70 Q166 95 126 98 Q88 101 54 88Z" fill="#1f2937" stroke="#64748b" strokeOpacity=".8" strokeWidth="1.2" />
              <path d="M96 122 Q122 112 150 126 Q146 152 122 166 Q96 157 89 139Z" fill="#1f2937" stroke="#64748b" strokeOpacity=".8" strokeWidth="1.2" />
              <path d="M188 64 Q230 44 284 60 Q317 55 334 75 Q320 98 288 108 Q244 114 198 103Z" fill="#1f2937" stroke="#64748b" strokeOpacity=".8" strokeWidth="1.2" />
              <path d="M286 120 Q313 111 341 126 Q334 154 304 169 Q283 156 277 136Z" fill="#1f2937" stroke="#64748b" strokeOpacity=".8" strokeWidth="1.2" />
              <path d="M344 72 Q375 51 420 68 Q442 61 463 80 Q451 104 422 112 Q384 115 350 101Z" fill="#1f2937" stroke="#64748b" strokeOpacity=".8" strokeWidth="1.2" />

              <text x="12" y="18" fill="#94a3b8" fontSize="10">Mapa global aproximado</text>
            </svg>

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/25 pointer-events-none" />
            {analytics.locationDots.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-xs text-slate-400 bg-slate-950/70 border border-slate-700/50 px-3 py-1.5 rounded-full">
                  Sin pings de ubicacion para este periodo.
                </p>
              </div>
            )}
            {analytics.locationDots.map((dot, index) => {
              const pos = mapDotPosition(dot.latitude, dot.longitude);
              const radius = Math.min(16, Math.max(4, dot.count + 3));
              return (
                <div
                  key={`${dot.latitude}-${dot.longitude}-${index}`}
                  title={`${dot.count} pings`}
                  className="absolute rounded-full animate-pulse"
                  style={{
                    left: pos.left,
                    top: pos.top,
                    width: radius * 2,
                    height: radius * 2,
                    transform: 'translate(-50%,-50%)',
                    background: dot.count > 15 ? '#FC0230' : dot.count > 7 ? '#FF8A65' : '#FFD580',
                    opacity: 0.85,
                  }}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            {analytics.locationRegions.map((region) => (
              <div key={region.name} className="bg-slate-900 rounded-lg p-2.5">
                <div className="text-[10px] text-slate-500 mb-1">{region.name}</div>
                <div className="text-sm font-bold text-white">{formatCompact(region.users)}</div>
                <div className="h-0.5 rounded-full mt-1.5 bg-primary-500 transition-all duration-700 ease-out" style={{ width: `${maxRegionUsers ? Math.round((region.users / maxRegionUsers) * 100) : 0}%` }} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 mb-3">Mapa de calor - ultimas 12 semanas</p>
          <div className="overflow-x-auto pb-1">
            <div className="grid gap-0.5 min-w-[320px]" style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}>
              {analytics.heatmap.map((value, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-sm"
                  style={{ background: heatColor(value, heatMax) }}
                  title={`${value} sesiones`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[10px] text-slate-500">Menos</span>
            {HEAT_PALETTE.map((color) => (
              <div key={color} className="w-3 h-3 rounded-sm" style={{ background: color }} />
            ))}
            <span className="text-[10px] text-slate-500">Mas</span>
          </div>
        </div>
      </div>

      <ChartsPanel analytics={analytics} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 mb-3">Participacion por tablero</p>
          <div className="space-y-2">
            {analytics.topBoards.length === 0 ? (
              <p className="text-xs text-slate-500">Sin datos de participacion para el periodo.</p>
            ) : (
              analytics.topBoards.map((board) => (
                <div key={`participation-${board.id}`} className="flex items-center gap-2 sm:gap-3 text-xs">
                  <span className="w-20 sm:w-24 text-slate-400 truncate">{board.title}</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${board.pct}%`, background: board.color }} />
                  </div>
                  <span className="text-slate-300 w-16 sm:w-20 text-right">{formatCompact(board.participantCount)} inicios</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-400 mb-3">Conversion inicio a completado</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Inicios de retos</span>
                <span className="text-white font-semibold">{formatCompact(analytics.conversion.startedBoards)}</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary-500" style={{ width: '100%' }} />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Retos completados</span>
                <span className="text-white font-semibold">{formatCompact(analytics.conversion.completedBoards)}</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-orange-500 transition-all duration-700 ease-out" style={{ width: `${Math.min(100, analytics.conversion.rate)}%` }} />
              </div>

              <div className="text-right text-xs font-bold text-primary-400">Tasa de conversion: {analytics.conversion.rate}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
