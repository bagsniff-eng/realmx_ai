import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

import { cn } from '@/lib/utils';

type FeedbackBannerProps = {
  title?: string;
  message: string;
  tone?: 'success' | 'error' | 'info';
  className?: string;
};

const toneMap = {
  success: {
    icon: CheckCircle2,
    className: 'border-realm-cyan/25 bg-realm-cyan/10 text-realm-cyan',
  },
  error: {
    icon: AlertTriangle,
    className: 'border-red-400/25 bg-red-400/10 text-red-200',
  },
  info: {
    icon: Info,
    className: 'border-white/10 bg-white/[0.04] text-white/75',
  },
} as const;

export function FeedbackBanner({
  title,
  message,
  tone = 'info',
  className,
}: FeedbackBannerProps) {
  const config = toneMap[tone];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-3xl border px-4 py-4 sm:px-5', config.className, className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-current/20 bg-black/10">
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          {title ? <p className="text-sm font-semibold">{title}</p> : null}
          <p className={cn('text-sm leading-6', title ? 'mt-1' : '')}>{message}</p>
        </div>
      </div>
    </div>
  );
}
