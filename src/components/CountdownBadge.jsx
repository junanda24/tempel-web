import { useEffect, useState } from "react";

// Signature #2: badge countdown 24 jam live
export default function CountdownBadge({ expiresAt }) {
  const [left, setLeft] = useState("");

  useEffect(() => {
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setLeft("hangus");
        return;
      }
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      setLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const urgent = left !== "hangus" && parseInt(left.slice(0, 2), 10) < 1;

  return (
    <span
      className={`countdown-tick inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold ${
        urgent
          ? "border-danger/30 bg-red-50 text-danger"
          : "border-line bg-white text-ink-soft"
      }`}
      title="Sisa waktu room sebelum hangus"
    >
      ⏳ {left}
    </span>
  );
}
