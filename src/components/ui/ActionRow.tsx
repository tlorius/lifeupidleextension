import type { HTMLAttributes, ReactNode } from "react";

interface ActionRowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ActionRow({
  className,
  children,
  ...divProps
}: ActionRowProps) {
  const classes = ["ui-action-row-end", className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...divProps}>
      {children}
    </div>
  );
}
