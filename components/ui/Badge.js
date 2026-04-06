import { cn } from '@/lib/utils';

const variantClasses = {
  default: 'bg-[#252540] text-[#8888AA]',
  primary: 'bg-[#6366F1]/15 text-[#6366F1]',
  success: 'bg-[#10B981]/15 text-[#10B981]',
  warning: 'bg-[#F59E0B]/15 text-[#F59E0B]',
  error: 'bg-[#EF4444]/15 text-[#EF4444]',
  pink: 'bg-[#EC4899]/15 text-[#EC4899]',
};

/**
 * Status badge / tag component
 * @param {'default'|'primary'|'success'|'warning'|'error'|'pink'} variant
 */
export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Maps booking status → badge variant */
export function StatusBadge({ status }) {
  const map = {
    confirmed: 'success',
    cancelled: 'error',
    rescheduled: 'warning',
    pending: 'warning',
  };
  return <Badge variant={map[status] || 'default'}>{status}</Badge>;
}
