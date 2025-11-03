import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BarProps {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}

export function Bar({ value, max = 1, className, label }: BarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span>{label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <Progress value={percentage} />
    </div>
  );
}
