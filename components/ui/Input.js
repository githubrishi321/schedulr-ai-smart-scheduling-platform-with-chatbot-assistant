import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable Input component with label, error, and icon support
 */
export const Input = forwardRef(function Input({
  label,
  error,
  hint,
  icon: Icon,
  className = '',
  ...props
}, ref) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#8888AA] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-[#8888AA]" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'block w-full py-2.5 bg-[#1A1A2E] border rounded-xl text-[#F0F0FF]',
            'placeholder-[#8888AA] transition-all duration-200',
            'focus:ring-2 focus:ring-[#6366F1] focus:border-transparent',
            error ? 'border-[#EF4444]/50' : 'border-[#2E2E50]',
            Icon ? 'pl-10 pr-4' : 'px-4',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-[#EF4444]">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-[#8888AA]">{hint}</p>}
    </div>
  );
});

/**
 * Reusable Textarea component
 */
export const Textarea = forwardRef(function Textarea({
  label, error, hint, className = '', ...props
}, ref) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#8888AA] mb-1.5">{label}</label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'block w-full px-4 py-2.5 bg-[#1A1A2E] border rounded-xl text-[#F0F0FF]',
          'placeholder-[#8888AA] transition-all duration-200 resize-none',
          'focus:ring-2 focus:ring-[#6366F1] focus:border-transparent',
          error ? 'border-[#EF4444]/50' : 'border-[#2E2E50]',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-[#EF4444]">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-[#8888AA]">{hint}</p>}
    </div>
  );
});

/**
 * Reusable Select component
 */
export const Select = forwardRef(function Select({
  label, error, options = [], className = '', ...props
}, ref) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#8888AA] mb-1.5">{label}</label>
      )}
      <select
        ref={ref}
        className={cn(
          'block w-full px-4 py-2.5 bg-[#1A1A2E] border rounded-xl text-[#F0F0FF]',
          'transition-all duration-200 cursor-pointer',
          'focus:ring-2 focus:ring-[#6366F1] focus:border-transparent',
          error ? 'border-[#EF4444]/50' : 'border-[#2E2E50]',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#1A1A2E]">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
});
