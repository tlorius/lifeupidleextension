import type { ButtonHTMLAttributes } from "react";

interface ToneButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  toneClassName?: string;
  useToneBase?: boolean;
}

export function ToneButton({
  className,
  toneClassName,
  useToneBase = true,
  ...buttonProps
}: ToneButtonProps) {
  const classes = [
    className,
    useToneBase ? "ui-btn-tone" : null,
    toneClassName ?? null,
  ]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} {...buttonProps} />;
}
