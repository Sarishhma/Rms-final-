
interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ message = "Preparing...", size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-18 h-18",
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 w-full h-full min-h-[180px]">
      <div className="relative flex items-center justify-center">
        {/* Outer rotating ring */}
        <div 
          className={`${sizeClasses[size]} rounded-full border-[2.5px] border-gray-200 border-t-[#FF7F11] border-r-[#FF7F11]/30 animate-spin`}
        />
        
        {/* Centered minimalist utensils icon */}
        <div className="absolute flex items-center justify-center text-[#FF7F11]/90">
          <svg 
            width={iconSizes[size]} 
            height={iconSizes[size]} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="animate-pulse"
          >
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2v0a5 5 0 0 0-5 5v8c0 1.1.9 2 2 2h3Z" />
            <path d="M19 17v5" />
          </svg>
        </div>
      </div>

      {message && (
        <p className="mt-4 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#FF7F11] flex items-center justify-center select-none">
          <span>{message.endsWith("...") ? message.slice(0, -3) : message}</span>
          {message.endsWith("...") && (
            <span className="inline-flex ml-1 text-sm font-black tracking-normal select-none leading-none">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
            </span>
          )}
        </p>
      )}
    </div>
  );
}
