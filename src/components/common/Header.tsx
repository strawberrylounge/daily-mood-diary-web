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
    <header id="header" className={styles.header}>
      <div className={`inner ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          Daily Mood Diary
        </Link>
        <nav className={styles.nav}>
          <ul>
            {NAV_ITEMS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles["nav-link"]} ${
                    pathname === href ? styles["active"] : ""
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
