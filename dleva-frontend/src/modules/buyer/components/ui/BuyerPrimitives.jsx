import { ArrowLeft, AlertCircle, CheckCircle2, Loader2, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../../utils/cn';

export const BuyerPageShell = ({
  children,
  className,
  contentClassName,
  maxWidth = 'max-w-5xl',
  withBottomNavSpacing = true,
}) => {
  return (
    <div className={cn('min-h-screen bg-bg', withBottomNavSpacing && 'pb-28 md:pb-10', className)}>
      <div className={cn('mx-auto w-full px-4 sm:px-6 md:px-8', maxWidth, contentClassName)}>{children}</div>
    </div>
  );
};

export const BuyerPageHeader = ({
  title,
  subtitle,
  action,
  onBack,
  backLabel = 'Back',
  showBack = false,
  sticky = false,
  className,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 border-b border-gray-100 py-5',
        sticky && 'sticky top-0 z-20 bg-bg/95 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {showBack ? (
          <button
            type="button"
            onClick={onBack || (() => navigate(-1))}
            className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-surface text-dark transition-colors hover:bg-gray-50 active:scale-[0.98]"
            aria-label={backLabel}
          >
            <ArrowLeft size={18} />
          </button>
        ) : null}

        <div className="min-w-0">
          <h1 className="text-[1.9rem] font-bold tracking-tight text-dark sm:text-[2.1rem]">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</p> : null}
        </div>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
};

export const BuyerCard = ({ children, className, interactive = false, muted = false }) => {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[20px] border border-gray-200 bg-surface shadow-[0_8px_24px_rgba(15,23,42,0.04)]',
        muted && 'bg-gray-50/70',
        interactive && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]',
        className
      )}
    >
      {children}
    </div>
  );
};

export const BuyerStatusBadge = ({ status, children, className }) => {
  const normalized = String(status || children || '').trim().toLowerCase().replace(/\s+/g, '_');

  const styles = {
    open: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    delivered: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    completed: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    ready: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    ongoing: 'border-amber-100 bg-amber-50 text-amber-700',
    pending: 'border-amber-100 bg-amber-50 text-amber-700',
    preparing: 'border-amber-100 bg-amber-50 text-amber-700',
    assigned: 'border-amber-100 bg-amber-50 text-amber-700',
    picked_up: 'border-amber-100 bg-amber-50 text-amber-700',
    on_the_way: 'border-amber-100 bg-amber-50 text-amber-700',
    arrived_at_pickup: 'border-amber-100 bg-amber-50 text-amber-700',
    closed: 'border-red-100 bg-red-50 text-red-700',
    cancelled: 'border-red-100 bg-red-50 text-red-700',
    cancelled_by_seller: 'border-red-100 bg-red-50 text-red-700',
    cancelled_by_buyer: 'border-red-100 bg-red-50 text-red-700',
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

export const BuyerPrimaryButton = ({ children, className, loading = false, disabled = false, icon, ...props }) => {
  return (
    <button
      className={cn(
        'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : icon}
      <span>{children}</span>
    </button>
  );
};

export const BuyerSecondaryButton = ({ children, className, icon, ...props }) => {
  return (
    <button
      className={cn(
        'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-surface px-4 py-3 text-sm font-bold text-dark transition-all hover:bg-gray-50 active:scale-[0.98]',
        className
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};

export const BuyerSegmentedTabs = ({ tabs, value, onChange, className }) => {
  return (
    <div className={cn('rounded-2xl border border-gray-200 bg-gray-50 p-1', className)}>
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const isActive = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-[14px] px-3 py-2.5 text-sm font-semibold transition-all',
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
};

export const BuyerSearchField = ({
  value,
  onChange,
  placeholder = 'Search',
  onClear,
  readOnly = false,
  onClick,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[20px] border border-gray-200 bg-gray-50 px-4 py-3.5',
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
};

export const BuyerFormField = ({ label, hint, error, className, children }) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</label> : null}
      {children}
      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
};

export const BuyerTextInput = ({
  icon: Icon,
  className,
  inputClassName,
  multiline = false,
  rows = 4,
  ...props
}) => {
  const sharedClassName = cn(
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-dark placeholder:text-muted focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10',
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

export const BuyerFeedbackState = ({ type = 'info', title, message, action, className }) => {
  const config = {
    loading: {
      icon: <Loader2 size={24} className="animate-spin text-primary" />,
      cardClass: 'border-gray-200 bg-surface',
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
      icon: <AlertCircle size={24} className="text-primary" />,
      cardClass: 'border-gray-200 bg-surface',
      titleClass: 'text-dark',
    },
  };

  const current = config[type] || config.info;

  if (type === 'loading') {
    return (
      <BuyerCard className={cn('p-6', current.cardClass, className)}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            {current.icon}
          </div>
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
      </BuyerCard>
    );
  }

  return (
    <BuyerCard className={cn('p-6 text-center', current.cardClass, className)}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/80">{current.icon}</div>
      {title ? <h3 className={cn('text-lg font-bold', current.titleClass)}>{title}</h3> : null}
      {message ? <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </BuyerCard>
  );
};

export const BuyerEmptyState = ({ icon, title, description, action, secondaryAction, className }) => {
  return (
    <BuyerCard className={cn('px-6 py-10 text-center', className)}>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-dark">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p> : null}
      <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
        {action}
        {secondaryAction}
      </div>
    </BuyerCard>
  );
};

export const BuyerAuthPanel = ({
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
    <BuyerPageShell
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-surface text-dark transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
          </button>
        ) : null}

        <div className="text-center">
          {icon ? (
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-24 sm:w-24">
              {icon}
            </div>
          ) : null}
          <h1 className="text-3xl font-bold tracking-tight text-dark">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p> : null}
        </div>

        <BuyerCard className="p-5 sm:p-6">{children}</BuyerCard>

        {footer ? <div className="text-center text-sm text-muted">{footer}</div> : null}
      </div>
    </BuyerPageShell>
  );
};
