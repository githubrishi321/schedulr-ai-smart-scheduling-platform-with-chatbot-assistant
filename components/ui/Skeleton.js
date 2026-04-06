/** Skeleton placeholder for loading states */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`skeleton rounded-lg ${className}`}
      aria-label="Loading..."
      {...props}
    />
  );
}

/** Card-shaped skeleton grid */
export function CardSkeleton() {
  return (
    <div className="bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-2 mt-2">
        <Skeleton className="h-8 w-20 rounded-xl" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}

/** Table row skeleton */
export function TableRowSkeleton({ cols = 4 }) {
  return (
    <tr className="border-b border-[#2E2E50]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}
