interface BoxChallengeLogoProps {
  className?: string;
}

/** Red mark with white letters — for dark headers (slate-900). */
export default function BoxChallengeLogo({ className = 'h-9 w-9 shrink-0' }: BoxChallengeLogoProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Box Challenge"
    >
      <rect width="80" height="80" rx="16" fill="#FC0230" />
      <text
        x="11"
        y="36"
        fill="#FFFFFF"
        fontFamily="Arial Black, Helvetica Neue, sans-serif"
        fontSize="30"
        fontWeight="900"
      >
        B
      </text>
      <text
        x="43"
        y="36"
        fill="#FFFFFF"
        fontFamily="Arial Black, Helvetica Neue, sans-serif"
        fontSize="30"
        fontWeight="900"
      >
        O
      </text>
      <text
        x="11"
        y="68"
        fill="#FFFFFF"
        fontFamily="Arial Black, Helvetica Neue, sans-serif"
        fontSize="30"
        fontWeight="900"
      >
        X
      </text>
      <rect x="46" y="48" width="11" height="11" rx="1.5" fill="#FFFFFF" />
      <rect x="59" y="48" width="11" height="11" rx="1.5" fill="#FFFFFF" />
      <rect x="46" y="61" width="11" height="11" rx="1.5" fill="#FFFFFF" />
      <rect x="59" y="61" width="11" height="11" rx="1.5" fill="#FFFFFF" />
    </svg>
  );
}

export const BOX_CHALLENGE_LOGO_SRC = '/images/box-challenge-logo.png';

export function isBoxChallengeLogoSrc(src?: string) {
  return src?.includes('box-challenge-logo') ?? false;
}
