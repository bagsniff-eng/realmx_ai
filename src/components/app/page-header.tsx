import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  aside?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, aside }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-serif text-4xl font-medium text-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/48 sm:text-base">
          {description}
        </p>
      </div>

      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}
