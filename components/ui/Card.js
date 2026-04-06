import { cn } from '@/lib/utils';

/**
 * Card container with glass-morphism styling
 */
export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={cn(
        'bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Stats card for the dashboard overview numbers
 * @param {string} label - Stat label
 * @param {string|number} value - Main number
 * @param {React.ReactNode} icon - Lucide icon component
 * @param {string} color - Accent color hex
 * @param {string} trend - Optional trend text e.g. "+5 this week"
 */
export function StatsCard({ label, value, icon: Icon, color = '#6366F1', trend }) {
  return (
    <Card className="p-5 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          {Icon && <Icon className="w-5 h-5" style={{ color }} />}
        </div>
        {trend && (
          <span className="text-xs text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full font-medium">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold font-['Syne'] text-[#F0F0FF]">{value}</p>
      <p className="text-sm text-[#8888AA] mt-1">{label}</p>
    </Card>
  );
}
