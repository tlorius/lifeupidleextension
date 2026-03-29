import type { CSSProperties, ReactNode } from "react";

interface ModalShellProps {
  onClose: () => void;
  children: ReactNode;
  panelStyle?: CSSProperties;
  overlayStyle?: CSSProperties;
  overlayClassName?: string;
  panelClassName?: string;
}

export function ModalShell({
  onClose,
  children,
  panelStyle,
  overlayStyle,
  overlayClassName,
  panelClassName,
}: ModalShellProps) {
  const overlayClass = overlayClassName
    ? `ui-modal-overlay ${overlayClassName}`
    : "ui-modal-overlay";
  const panelClass = panelClassName
    ? `ui-modal-panel ${panelClassName}`
    : "ui-modal-panel";

  return (
    <div className={overlayClass} style={overlayStyle} onClick={onClose}>
      <div
        className={panelClass}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
