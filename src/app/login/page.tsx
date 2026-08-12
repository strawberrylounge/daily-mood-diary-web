"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/AuthProvider";

import styles from "./login.module.scss";

export default function LoginPage() {
  const { session, signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) router.replace("/");
  }, [session, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: signInError } = await signIn(email, password);

    setSubmitting(false);

    if (signInError) {
      setError(
        signInError.includes("Supabase 설정")
          ? signInError
          : "이메일 또는 비밀번호가 올바르지 않습니다.",
      );
      return;
    }

    router.replace("/");
  };

  return (
    <main id="content" className={styles.page}>
      <div className="inner">
        <h1 className={styles.title}>로그인</h1>
        <p className={styles.description}>
          로그인 없이도 이 페이지의 모든 기능을 자유롭게 체험할 수 있습니다.
          (브라우저에만 저장되는 임시 데이터)
          <br />
          로그인은 운영자 본인 계정으로 실제 데이터를 관리할 때만 사용합니다.
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </main>
  );
}
