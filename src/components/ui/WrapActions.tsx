import type { HTMLAttributes, ReactNode } from "react";

interface WrapActionsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  spacious?: boolean;
}

export function WrapActions({
  className,
  children,
  spacious = false,
  ...divProps
}: WrapActionsProps) {
  const classes = [
    "ui-garden-inline-actions",
    spacious ? "ui-garden-inline-actions--spacious" : null,
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
