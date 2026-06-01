export function SkeletonPanel({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-slate-700/40 bg-slate-800/40 animate-pulse ${className}`}
    />
  );
}

export function AdminStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPanel key={i} className="h-20" />
      ))}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden space-y-0">
      <SkeletonPanel className="h-10 rounded-none border-x-0 border-t-0" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonPanel key={i} className="h-12 rounded-none border-x-0" />
      ))}
    </div>
  );
}

export function AdminUserCardsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonPanel key={i} className="h-24" />
      ))}
    </div>
  );
}

export function AdminSubmissionsGridSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonPanel key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  );
}

export function AdminBoardsListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonPanel key={i} className="h-36" />
      ))}
    </div>
  );
}

export function AdminChallengeSlotsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonPanel key={i} className="aspect-square" />
      ))}
    </div>
  );
}

export function AdminOrgDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      <SkeletonPanel className="h-8 w-56" />
      <SkeletonPanel className="h-32" />
      <SkeletonPanel className="h-48" />
      <AdminTableSkeleton rows={4} />
    </div>
  );
}

/** Session / auth gate while admin shell is not ready yet */
export function AdminLayoutSkeleton() {
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <SkeletonPanel className="hidden lg:block w-56 shrink-0 h-full rounded-none border-y-0 border-l-0" />
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-8 space-y-6">
        <SkeletonPanel className="h-8 w-48" />
        <AdminStatsSkeleton count={4} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonPanel className="h-28" />
          <SkeletonPanel className="h-28" />
        </div>
      </div>
    </div>
  );
}
