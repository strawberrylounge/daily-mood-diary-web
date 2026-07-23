"use client";

import { useEffect } from "react";

import CloseIcon from "@/assets/icons/close.svg";

import styles from "./SidePanel.module.scss";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function SidePanel({
  isOpen,
  onClose,
  title,
  children,
}: SidePanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.visible : ""}`} onClick={onClose}>
      <div className={`${styles.panel} ${isOpen ? styles.open : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          <button className={styles.closeBtn} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
