"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/AuthProvider";

import styles from "./Header.module.scss";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/stats", label: "통계" },
  { href: "/settings", label: "설정" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

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
            {!loading && (
              <li>
                {session ? (
                  <button
                    type="button"
                    className={styles["nav-link"]}
                    onClick={handleLogout}
                  >
                    로그아웃
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className={`${styles["nav-link"]} ${
                      pathname === "/login" ? styles["active"] : ""
                    }`}
                  >
                    로그인
                  </Link>
                )}
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
