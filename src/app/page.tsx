"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    const test = async () => {
      const { error } = await supabase
        .from("daily_records")
        .select("count")
        .limit(1);

      setStatus(error ? "error" : "success");
    };

    test();
  }, []);

  return (
    <div>
      {status === "loading" && "⏳ 연결 중..."}
      {status === "success" && "✅ Supabase 연결 성공!"}
      {status === "error" && "❌ 연결 실패"}
    </div>
  );
}
