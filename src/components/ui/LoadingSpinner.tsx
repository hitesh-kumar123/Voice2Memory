interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-[3px]",
};

export default function LoadingSpinner({
  size = "md",
  label = "Loading…",
}: LoadingSpinnerProps) {
  return (
    <div role="status" className="flex items-center gap-3">
      <div
        className={`${sizeMap[size]} rounded-full border-border border-t-primary animate-spin-slow`}
        aria-hidden="true"
      />
      <span className="text-sm text-muted-foreground sr-only">{label}</span>
    </div>
  );
}
