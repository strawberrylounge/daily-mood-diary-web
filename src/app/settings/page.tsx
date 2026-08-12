"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/AuthProvider";

import styles from "./settings.module.scss";

export default function SettingsPage() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <main id="content" className={styles.page}>
      <div className="inner">
        <h1 className={styles.title}>설정</h1>

        <section className={styles.section}>
          <h2 className={styles.label}>계정 정보</h2>
          <div className={styles.infoBox}>
            <p className={styles.infoLabel}>이메일</p>
            <p className={styles.infoValue}>
              {session ? session.user.email : "로그인하지 않음 (브라우저 임시 데이터 사용 중)"}
            </p>
          </div>
        </section>

        {session ? (
          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            로그아웃
          </button>
        ) : (
          <Link href="/login" className={styles.loginButton}>
            로그인
          </Link>
        )}
      </div>
    </main>
  );
}
