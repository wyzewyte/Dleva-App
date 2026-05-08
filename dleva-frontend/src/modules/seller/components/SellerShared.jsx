import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { SellerCard, SellerStatusBadge } from './ui/SellerPrimitives';

export const SellerSummaryCard = ({ title, value, hint, icon: Icon, accent = 'bg-primary', className }) => (
  <SellerCard className={cn('p-4 sm:p-5', className)}>
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{title}</p>
        <h3 className="mt-2 truncate text-2xl font-bold tracking-tight text-dark sm:text-3xl">{value}</h3>
      </div>
      {Icon ? (
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm sm:h-12 sm:w-12', accent)}>
          <Icon size={20} />
        </div>
      ) : null}
    </div>
  </SellerCard>
);

export const SellerSectionIntro = ({ eyebrow, title, subtitle, action, className }) => (
  <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
    <div className="min-w-0">
      {eyebrow ? <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">{eyebrow}</p> : null}
      <h2 className="mt-1 text-xl font-bold tracking-tight text-dark sm:text-2xl">{title}</h2>
      {subtitle ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</p> : null}
    </div>
    {action ? <div className="w-full sm:w-auto">{action}</div> : null}
  </div>
);

export const SellerActionTile = ({ title, description, icon: Icon, to, onClick, badge, className }) => {
  const content = (
    <SellerCard interactive className={cn('p-4', className)}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-dark sm:text-base">{title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {badge ? <SellerStatusBadge className="hidden shrink-0 sm:inline-flex">{badge}</SellerStatusBadge> : null}
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary sm:hidden">
            <ChevronRight size={16} />
          </div>
          <div className="hidden items-center gap-1 text-sm font-semibold text-primary sm:inline-flex">
            <span>Open</span>
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </SellerCard>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  );
};

export const SellerKeyValueList = ({ items, className }) => (
  <SellerCard className={cn('divide-y divide-gray-100', className)}>
    {items.map((item) => (
      <div key={item.label} className="flex items-start justify-between gap-4 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">{item.label}</p>
          {item.hint ? <p className="mt-1 text-xs text-muted">{item.hint}</p> : null}
        </div>
        <div className="text-right text-sm font-semibold text-dark">{item.value}</div>
      </div>
    ))}
  </SellerCard>
);

export const SellerInlineMetric = ({ label, value, tone = 'default', className }) => {
  const tones = {
    default: 'bg-white/80 text-dark',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    info: 'bg-sky-50 text-sky-700',
  };

  return (
    <div className={cn('rounded-2xl px-4 py-3 shadow-sm', tones[tone] || tones.default, className)}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
};

export const SellerListRow = ({ title, subtitle, meta, actionLabel, to, onClick, className }) => {
  const row = (
    <SellerCard interactive className={cn('p-4', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-dark">{title}</p>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          {meta ? <span className="hidden text-xs font-semibold text-muted sm:inline">{meta}</span> : null}
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-dark">
            <ArrowUpRight size={16} />
          </div>
        </div>
      </div>
      {actionLabel ? <p className="mt-3 text-sm font-semibold text-primary">{actionLabel}</p> : null}
    </SellerCard>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {row}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {row}
    </button>
  );
};
