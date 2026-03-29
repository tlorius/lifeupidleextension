import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

interface PanelSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  surfaceStyle?: CSSProperties;
}

export function PanelSurface({
  className,
  children,
  style,
  surfaceStyle,
  ...divProps
}: PanelSurfaceProps) {
  const classes = ["ui-panel-surface", className].filter(Boolean).join(" ");

  return (
    <div
      className={classes}
      style={{ ...surfaceStyle, ...style }}
      {...divProps}
    >
      {children}
    </div>
  );
}
