import { cn } from '@/lib/utils';
import { BOX_LOGO_SRC } from '@/components/brand/constants';
import styles from './box-challenge-loader.module.css';

const SIZE_PX = {
  xs: 16,
  sm: 20,
  md: 40,
  lg: 72,
  xl: 120,
} as const;

export type BoxChallengeLoaderSize = keyof typeof SIZE_PX;

type BoxChallengeLoaderProps = {
  size?: BoxChallengeLoaderSize;
  label?: string;
  className?: string;
  priority?: boolean;
  showGlow?: boolean;
  /** Row layout without extra gap — for buttons and inline rows */
  compact?: boolean;
};

export default function BoxChallengeLoader({
  size = 'md',
  label,
  className,
  priority = false,
  showGlow = true,
  compact = false,
}: BoxChallengeLoaderProps) {
  const px = SIZE_PX[size];
  const glow = showGlow && size !== 'xs' && !compact;

  return (
    <div
      className={cn(styles.root, compact && styles.compact, className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.mark} style={{ width: px, height: px }}>
        {glow && <span className={styles.glow} aria-hidden />}
        {/* img estático: evita retrasos de next/image en transiciones del bottom nav */}
        <img
          src={BOX_LOGO_SRC}
          alt="Box Challenge"
          width={px}
          height={px}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          className={styles.logo}
          style={{ width: px, height: px }}
        />
      </div>
      {label ? <p className={styles.label}>{label}</p> : null}
      {!label ? <span className="sr-only">Cargando…</span> : null}
    </div>
  );
}
