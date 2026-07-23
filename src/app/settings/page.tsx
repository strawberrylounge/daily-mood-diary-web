"use client";

import styles from "./settings.module.scss";

// TODO: 인증 연동 후 실제 계정 정보/로그아웃 로직 연결 필요 (현재는 인증 미포함)
export default function SettingsPage() {
  return (
    <main id="content" className={styles.page}>
      <div className="inner">
        <h1 className={styles.title}>설정</h1>

        <section className={styles.section}>
          <h2 className={styles.label}>계정 정보</h2>
          <div className={styles.infoBox}>
            <p className={styles.infoLabel}>이메일</p>
            <p className={styles.infoValue}>로그인 연동 예정</p>
          </div>
        </section>

        <button type="button" className={styles.logoutButton} disabled>
          로그아웃 (로그인 연동 후 사용 가능)
        </button>
      </div>
    </main>
  );
}
