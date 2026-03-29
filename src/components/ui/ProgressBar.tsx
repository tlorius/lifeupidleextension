import type { CSSProperties, HTMLAttributes } from "react";

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  fillStyle?: CSSProperties;
  trackStyle?: CSSProperties;
}

export function ProgressBar({
  className,
  value,
  fillStyle,
  trackStyle,
  ...divProps
}: ProgressBarProps) {
  const width = `${Math.max(0, Math.min(100, value))}%`;

  return (
    <div
      className={["ui-progress-track", className].filter(Boolean).join(" ")}
      style={trackStyle}
      {...divProps}
    >
      <div className="ui-progress-fill" style={{ width, ...fillStyle }} />
    </div>
  );
}
