import type { HTMLAttributes, ReactNode } from "react";

interface GardenDetailCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function GardenDetailCard({
  className,
  children,
  ...divProps
}: GardenDetailCardProps) {
  const classes = ["ui-card", "ui-garden-detail-card", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...divProps}>
      {children}
    </div>
  );
}
