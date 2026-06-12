import { Skeleton } from "@/components/ui/skeleton";

export function ChatSkeleton() {
  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden">
      {/* Sidebar skeleton */}
      <aside className="hidden w-[280px] shrink-0 border-r border-(--line-strong) bg-(--surface-panel) lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 px-5">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="px-4">
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
        <div className="px-4 pt-5">
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
        <div className="mt-4 flex flex-col gap-2 px-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </aside>

      {/* Main area skeleton */}
      <div className="flex flex-1 flex-col items-center justify-center px-5">
        <Skeleton className="h-12 w-80 rounded-xl" />
        <Skeleton className="mt-4 h-6 w-96 rounded-lg" />
        <div className="mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
