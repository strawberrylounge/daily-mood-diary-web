# daily-mood-diary-web

매일의 기분을 캘린더에 기록하고, 월간 평가와 통계로 돌아볼 수 있는 개인용 무드 다이어리.

## Node 버전

v20.19.5

## Tech Stack

- Next.js 16.2.4 / React 19.2.4 / TypeScript
- Supabase (Auth + DB)
- Sass, Recharts

## 시작하기

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인.

## 환경 변수

`.env.example` 참고. 로그인하지 않은 상태에서는 브라우저 localStorage만 사용해서 값이 없어도 앱은 정상 동작한다. 로그인해서 실제 Supabase DB에 기록하려면 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 필요하다.

## 에러 로그

[Notion 에러 로그](https://app.notion.com/p/strawberrylounge/b605f6b76e7b40eb89931d7c042c2954) 에서 관리 중.
