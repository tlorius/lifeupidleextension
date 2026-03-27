import type { HTMLAttributes, ReactNode } from "react";

interface NoticeCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  warning?: boolean;
}

export function NoticeCard({
  className,
  children,
  warning = false,
  ...divProps
}: NoticeCardProps) {
  const classes = [
    "ui-notice-card",
    warning ? "ui-notice-card--warning" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...divProps}>
      {children}
    </div>
  );
}
