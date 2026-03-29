import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  heading: ReactNode;
  actions?: ReactNode;
  titleStyle?: CSSProperties;
}

export function ModalHeader({
  className,
  heading,
  actions,
  titleStyle,
  ...divProps
}: ModalHeaderProps) {
  const classes = ["ui-modal-header", className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...divProps}>
      <h3 style={{ margin: 0, ...titleStyle }}>{heading}</h3>
      {actions}
    </div>
  );
}
