import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type TileChipTone = "adj" | "harvester" | "planter";

interface TileChipProps extends HTMLAttributes<HTMLDivElement> {
  tone: TileChipTone;
  children: ReactNode;
  style?: CSSProperties;
}

export function TileChip({
  tone,
  className,
  children,
  ...divProps
}: TileChipProps) {
  const classes = ["ui-tile-chip", `ui-tile-chip--${tone}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...divProps}>
      {children}
    </div>
  );
}
