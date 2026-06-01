import { cn } from '@/lib/utils';
import BoxChallengeLoader from '@/components/brand/BoxChallengeLoader';

type AppLoadingScreenProps = {
  message?: string;
  className?: string;
};

export default function AppLoadingScreen({ message, className }: AppLoadingScreenProps) {
  return (
    <div
      className={cn(
        'min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-950 px-6',
        className
      )}
    >
      <BoxChallengeLoader size="xl" label={message} priority showGlow={false} />
    </div>
  );
}
