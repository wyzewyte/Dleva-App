import { Phone } from 'lucide-react';
import { formatPhoneNumber } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const EntityContactCard = ({
  label,
  title,
  description,
  phone,
  icon: Icon,
  actionLabel,
  className,
  cardClassName,
  iconClassName,
  actionClassName,
}) => {
  if (!title && !description && !phone) return null;

  return (
    <div className={cn('rounded-[20px] border border-gray-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]', cardClassName, className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary', iconClassName)}>
            <Icon size={18} />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          {label ? <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p> : null}
          {title ? <p className="mt-2 text-sm font-semibold text-dark">{title}</p> : null}
          {description ? <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p> : null}

          {phone ? (
            <a
              href={`tel:${phone}`}
              className={cn(
                'mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90',
                actionClassName
              )}
            >
              <Phone size={15} />
              {actionLabel || `Call ${formatPhoneNumber(phone) || phone}`}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EntityContactCard;
