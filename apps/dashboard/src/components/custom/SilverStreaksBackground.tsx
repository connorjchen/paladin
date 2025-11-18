interface SilverStreaksBackgroundProps {
  children: React.ReactNode
  className?: string
}

export function SilverStreaksBackground({
  children,
  className = '',
}: SilverStreaksBackgroundProps) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-black ${className}`}
    >
      {/* Silver streaks background */}
      <div className="absolute inset-0 opacity-30">
        {/* Silver streaks */}
        <div className="absolute left-8 top-12 h-32 w-32 rounded-full bg-gradient-to-br from-slate-400 via-gray-300 to-white blur-xl"></div>
        <div className="absolute bottom-16 right-12 h-28 w-28 rounded-full bg-gradient-to-tl from-gray-300 via-slate-200 to-white blur-lg"></div>
        <div className="absolute left-1/3 top-1/2 h-20 w-20 rounded-full bg-gradient-to-tr from-slate-300 via-gray-200 to-white blur-md"></div>

        {/* Organic silver lines */}
        <div className="absolute left-1/4 top-1/3 h-0.5 w-16 rotate-12 bg-gradient-to-r from-transparent via-slate-300 to-transparent blur-sm"></div>
        <div className="absolute bottom-1/3 right-1/4 h-0.5 w-12 -rotate-45 bg-gradient-to-r from-transparent via-gray-300 to-transparent blur-sm"></div>
        <div className="rotate-30 absolute left-1/2 top-1/4 h-0.5 w-10 bg-gradient-to-r from-transparent via-white to-transparent blur-sm"></div>

        {/* Organic curves */}
        <div className="absolute left-16 top-1/2 h-8 w-16 rounded-full bg-gradient-to-r from-slate-400 via-gray-300 to-white blur-md"></div>
        <div className="absolute bottom-1/4 right-20 h-6 w-12 rounded-full bg-gradient-to-l from-gray-300 via-slate-200 to-white blur-md"></div>

        {/* Subtle silver accents */}
        <div className="absolute left-24 top-1/3 h-2 w-2 rounded-full bg-slate-300 blur-sm"></div>
        <div className="absolute bottom-1/3 right-28 h-1.5 w-1.5 rounded-full bg-gray-400 blur-sm"></div>
        <div className="absolute left-1/2 top-16 h-2 w-2 rounded-full bg-white blur-sm"></div>

        {/* Additional organic shapes */}
        <div className="absolute bottom-1/4 left-1/3 h-16 w-16 rounded-full bg-gradient-to-br from-slate-300 via-gray-200 to-white blur-lg"></div>
        <div className="absolute right-1/3 top-1/3 h-12 w-12 rounded-full bg-gradient-to-tl from-gray-300 via-slate-200 to-white blur-md"></div>
      </div>

      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}
