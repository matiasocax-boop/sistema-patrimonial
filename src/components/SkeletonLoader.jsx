export default function SkeletonLoader() {
    return (
        <div className="w-full flex-1 bg-white dark:bg-darkbg-card rounded-[24px] border border-zinc-200/80 dark:border-darkbg-border shadow-sm overflow-hidden flex flex-col min-h-[550px] animate-pulse">
            <div className="sticky top-0 bg-zinc-50/95 dark:bg-darkbg-main/95 border-b border-zinc-200/80 dark:border-darkbg-border px-8 py-4 flex justify-between hidden md:flex">
                <div className="h-3 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            </div>

            <div className="p-4 md:p-0 divide-y divide-transparent md:divide-zinc-100 md:dark:divide-darkbg-border/60">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="mb-4 md:mb-0 p-4 md:px-6 md:py-4 border border-zinc-200/80 md:border-0 rounded-2xl md:rounded-none flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 shrink-0 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
                            <div className="space-y-2 flex-1">
                                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
                                <div className="h-2 bg-zinc-100 dark:bg-zinc-800/50 rounded w-2/3"></div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2 mt-2 md:mt-0 pt-2 border-t border-dashed md:border-none md:pt-0 border-zinc-100 dark:border-darkbg-border">
                            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
                            <div className="h-2 bg-zinc-100 dark:bg-zinc-800/50 rounded w-1/3"></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t md:border-none md:pt-0 border-zinc-100 dark:border-darkbg-border shrink-0">
                            <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                            <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                            <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
