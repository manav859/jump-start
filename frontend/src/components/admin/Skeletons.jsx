/**
 * Reusable skeleton loading components for the admin panel.
 * These provide shimmer animations instead of plain "Loading..." text.
 */

/* ── Base shimmer block ─────────────────────────────── */
export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gray-200/70 ${className}`}
    />
  );
}

/* ── KPI card skeleton ──────────────────────────────── */
export function KpiSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50"
        >
          <Skeleton className="h-3 w-24 mb-4" />
          <Skeleton className="h-8 w-32 mb-3" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

/* ── Chart skeleton ─────────────────────────────────── */
export function ChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
      <Skeleton className="h-5 w-32 mb-6" />
      <div className="h-64 flex items-end gap-3 px-2">
        {[40, 65, 45, 80, 55, 70, 50, 60, 75, 45, 85, 55].map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-lg"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Table skeleton ─────────────────────────────────── */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
      <div className="p-6 border-b">
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-6 py-3 text-left">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="px-6 py-4">
                    <Skeleton
                      className={`h-4 ${c === 1 ? "w-28" : c === 3 ? "w-20" : "w-24"}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Full page dashboard skeleton ───────────────────── */
export function DashboardSkeleton() {
  return (
    <main className="p-6 md:p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-8">
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <KpiSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton />
    </main>
  );
}

/* ── Settings page skeleton ─────────────────────────── */
export function SettingsSkeleton() {
  return (
    <div className="p-6 md:p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-6">
      <Skeleton className="h-7 w-40 mb-2" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 space-y-4"
        >
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/* ── Submission review skeleton ─────────────────────── */
export function ReviewSkeleton() {
  return (
    <div className="p-6 md:p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-6">
      <Skeleton className="h-7 w-56 mb-2" />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 space-y-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
