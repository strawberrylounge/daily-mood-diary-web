"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./Header.module.scss";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/stats", label: "통계" },
  { href: "/settings", label: "설정" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          Daily Mood Diary
        </Link>
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${
                pathname === href ? styles.navLinkActive : ""
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
