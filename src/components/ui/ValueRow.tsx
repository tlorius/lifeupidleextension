import type { HTMLAttributes, ReactNode } from "react";

interface ValueRowProps extends HTMLAttributes<HTMLDivElement> {
  left: ReactNode;
  right: ReactNode;
}

export function ValueRow({
  className,
  left,
  right,
  ...divProps
}: ValueRowProps) {
  const classes = ["ui-value-row", className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...divProps}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}
