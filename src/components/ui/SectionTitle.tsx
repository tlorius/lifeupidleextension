import type { HTMLAttributes, ReactNode } from "react";

interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function SectionTitle({
  className,
  children,
  ...headingProps
}: SectionTitleProps) {
  const classes = ["ui-section-title-16", className].filter(Boolean).join(" ");

  return (
    <h3 className={classes} {...headingProps}>
      {children}
    </h3>
  );
}
