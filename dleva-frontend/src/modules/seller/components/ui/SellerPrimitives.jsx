import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Search,
  Store,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../../utils/cn';

export const SellerPageShell = ({
  children,
  className,
  contentClassName,
  maxWidth = 'max-w-6xl',
  withBottomNavSpacing = true,
}) => (
  <div
    className={cn(
      'min-h-screen bg-white',
      withBottomNavSpacing && 'pb-28 md:pb-10',
      className
    )}
  >
    <div className={cn('mx-auto w-full px-4 sm:px-6 md:px-8', maxWidth, contentClassName)}>{children}</div>
  </div>
);

export const SellerPageHeader = ({
  title,
  subtitle,
  action,
  onBack,
  backLabel = 'Back',
  showBack = false,
  sticky = false,
  className,
  eyebrow,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 border-b border-white/60 py-5',
        sticky &&
          'sticky top-[72px] z-30 -mx-4 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/90 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {showBack ? (
          <button
            type="button"
            onClick={onBack || (() => navigate(-1))}
            className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-dark transition-colors hover:bg-gray-50 active:scale-[0.98]"
            aria-label={backLabel}
          >
            <ArrowLeft size={18} />
          </button>
        ) : null}

        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">{eyebrow}</p>
          ) : null}
          <h1 className="text-[1.8rem] font-bold tracking-tight text-dark sm:text-[2.05rem]">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</p> : null}
        </div>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
};

export const SellerCard = ({ children, className, interactive = false, muted = false }) => (
  <div
    className={cn(
      'overflow-hidden rounded-[24px] border border-white/80 bg-white/95 shadow-[0_2px_8px_rgba(15,23,42,0.03)] backdrop-blur-sm',
      muted && 'bg-[#fcfcfa]',
      interactive && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(15,23,42,0.05)]',
      className
    )}
  >
    {children}
  </div>
);

export const SellerStatusBadge = ({ status, children, className }) => {
  const normalized = String(status || children || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  const styles = {
    open: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    active: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    delivered: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    available_for_pickup: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    preparing: 'border-amber-100 bg-amber-50 text-amber-700',
    confirming: 'border-sky-100 bg-sky-50 text-sky-700',
    pending: 'border-sky-100 bg-sky-50 text-sky-700',
    awaiting_rider: 'border-violet-100 bg-violet-50 text-violet-700',
    assigned: 'border-violet-100 bg-violet-50 text-violet-700',
    arrived_at_pickup: 'border-violet-100 bg-violet-50 text-violet-700',
    picked_up: 'border-indigo-100 bg-indigo-50 text-indigo-700',
    unread: 'border-primary/20 bg-primary/10 text-primary',
    inactive: 'border-gray-200 bg-gray-100 text-gray-700',
    hidden: 'border-gray-200 bg-gray-100 text-gray-700',
    closed: 'border-red-100 bg-red-50 text-red-700',
    cancelled: 'border-red-100 bg-red-50 text-red-700',
    error: 'border-red-100 bg-red-50 text-red-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]',
        styles[normalized] || 'border-gray-200 bg-gray-100 text-gray-700',
        className
      )}
    >
      {children || status}
    </span>
  );
};

export const SellerPrimaryButton = ({ children, className, loading = false, disabled = false, icon, ...props }) => (
  <button
    className={cn(
      'inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? <Loader2 size={18} className="animate-spin" /> : icon}
    <span>{children}</span>
  </button>
);

export const SellerSecondaryButton = ({ children, className, icon, ...props }) => (
  <button
    className={cn(
      'inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-dark transition-all hover:bg-gray-50 active:scale-[0.98]',
      className
    )}
    {...props}
  >
    {icon}
    <span>{children}</span>
  </button>
);

export const SellerQuietButton = ({ children, className, icon, ...props }) => (
  <button
    className={cn(
      'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-gray-100 hover:text-dark',
      className
    )}
    {...props}
  >
    {icon}
    <span>{children}</span>
  </button>
);

export const SellerSegmentedTabs = ({ tabs, value, onChange, className }) => (
  <div className={cn('rounded-2xl border border-gray-200 bg-white/80 p-1', className)}>
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
      {tabs.map((tab) => {
        const isActive = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-[14px] px-3 py-2.5 text-sm font-semibold transition-all sm:flex-1',
              isActive ? 'bg-dark text-white shadow-sm' : 'text-muted hover:text-dark'
            )}
          >
            <span className="truncate">{tab.label}</span>
            {tab.badge > 0 ? (
              <span
                className={cn(
                  'inline-flex h-5 min-w-[20px] items-center justify-center rounded-md px-1 text-[10px] font-bold leading-none',
                  isActive ? 'bg-white text-dark' : 'bg-gray-200 text-dark'
                )}
              >
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  </div>
);

export const SellerSearchField = ({
  value,
  onChange,
  placeholder = 'Search',
  onClear,
  readOnly = false,
  onClick,
  className,
}) => (
  <div
    className={cn(
      'flex items-center gap-3 rounded-[20px] border border-gray-200 bg-white/90 px-4 py-3.5 shadow-sm',
      onClick && 'cursor-pointer',
      className
    )}
    onClick={onClick}
  >
    <Search size={18} className="shrink-0 text-muted" />
    <input
      type="text"
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      className="flex-1 bg-transparent text-sm text-dark placeholder:text-muted focus:outline-none"
    />
    {value ? (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClear?.();
        }}
        className="text-muted transition-colors hover:text-dark"
      >
        <X size={16} />
      </button>
    ) : null}
  </div>
);

export const SellerFormField = ({ label, hint, error, className, children }) => (
  <div className={cn('space-y-1.5', className)}>
    {label ? <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</label> : null}
    {children}
    {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
    {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
  </div>
);

export const SellerTextInput = ({
  icon: Icon,
  className,
  inputClassName,
  multiline = false,
  rows = 4,
  ...props
}) => {
  const sharedClassName = cn(
    'w-full rounded-xl border border-gray-200 bg-[#fbfbfa] px-4 py-3 text-sm text-dark placeholder:text-muted focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10',
    Icon && !multiline && 'pl-11',
    multiline && 'resize-none',
    inputClassName
  );

  return (
    <div className={cn('relative', className)}>
      {Icon && !multiline ? (
        <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      ) : null}
      {multiline ? <textarea rows={rows} className={sharedClassName} {...props} /> : <input className={sharedClassName} {...props} />}
    </div>
  );
};

export const SellerFeedbackState = ({ type = 'info', title, message, action, className }) => {
  const config = {
    loading: {
      icon: <Loader2 size={24} className="animate-spin text-primary" />,
      cardClass: 'border-gray-200 bg-white',
      titleClass: 'text-dark',
    },
    error: {
      icon: <AlertCircle size={24} className="text-red-500" />,
      cardClass: 'border-red-100 bg-red-50',
      titleClass: 'text-red-700',
    },
    success: {
      icon: <CheckCircle2 size={24} className="text-emerald-600" />,
      cardClass: 'border-emerald-100 bg-emerald-50',
      titleClass: 'text-emerald-700',
    },
    info: {
      icon: <Store size={24} className="text-primary" />,
      cardClass: 'border-gray-200 bg-white',
      titleClass: 'text-dark',
    },
  };

  const current = config[type] || config.info;

  if (type === 'loading') {
    return (
      <SellerCard className={cn('p-6', current.cardClass, className)}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">{current.icon}</div>
          <div className="min-w-0 flex-1">
            {title ? <h3 className={cn('text-base font-bold', current.titleClass)}>{title}</h3> : null}
            {message ? <p className="mt-1 text-sm leading-relaxed text-muted">{message}</p> : null}
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
        </div>
        {action ? <div className="mt-5">{action}</div> : null}
      </SellerCard>
    );
  }

  return (
    <SellerCard className={cn('p-6 text-center', current.cardClass, className)}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/80">{current.icon}</div>
      {title ? <h3 className={cn('text-lg font-bold', current.titleClass)}>{title}</h3> : null}
      {message ? <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </SellerCard>
  );
};

export const SellerEmptyState = ({ icon, title, description, action, secondaryAction, className }) => (
  <SellerCard className={cn('px-6 py-10 text-center', className)}>
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
    <h3 className="text-lg font-bold text-dark">{title}</h3>
    {description ? <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p> : null}
    <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
      {action}
      {secondaryAction}
    </div>
  </SellerCard>
);

export const SellerAuthPanel = ({
  title,
  subtitle,
  children,
  footer,
  icon,
  className,
  showBack = false,
  onBack,
  backLabel = 'Back',
}) => {
  const navigate = useNavigate();

  return (
    <SellerPageShell
      maxWidth="max-w-md"
      withBottomNavSpacing={false}
      contentClassName="flex min-h-screen flex-col justify-center py-10"
    >
      <div className={cn('space-y-6', className)}>
        {showBack ? (
          <button
            type="button"
            onClick={onBack || (() => navigate(-1))}
            aria-label={backLabel}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-dark transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
          </button>
        ) : null}

        <div className="text-center">
          {icon ? (
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary sm:h-24 sm:w-24">
              {icon}
            </div>
          ) : null}
          <h1 className="text-3xl font-bold tracking-tight text-dark">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p> : null}
        </div>

        <SellerCard className="p-5 sm:p-6">{children}</SellerCard>

        {footer ? <div className="text-center text-sm text-muted">{footer}</div> : null}
      </div>
    </SellerPageShell>
  );
};
