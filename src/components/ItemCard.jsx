import { useState } from "react";
import { track } from "../lib/api.js";

const fmtSize = (b) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`;
const fmtTime = (iso) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ItemCard({ item, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.content);
      setCopied(true);
      track("item_copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback: pilih teks manual
      const ta = document.createElement("textarea");
      ta.value = item.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const isImage = item.type === "file" && item.mime.startsWith("image/");

  return (
    <article className="rounded-lg border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-ink-soft uppercase">
          {item.type === "text" ? "📝 Teks" : "📎 File"} · {fmtTime(item.createdAt)}
        </span>
        {confirmDel ? (
          <span className="flex gap-2">
            <button
              onClick={() => onDelete(item.id)}
              className="rounded bg-danger px-2.5 py-1 text-xs font-bold text-white"
            >
              Ya, hapus
            </button>
            <button
              onClick={() => setConfirmDel(false)}
              className="rounded border border-line px-2.5 py-1 text-xs font-bold text-ink-soft"
            >
              Batal
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmDel(true)}
            aria-label="Hapus item"
            className="rounded px-2 py-1 text-sm text-ink-soft transition hover:bg-red-50 hover:text-danger"
          >
            🗑
          </button>
        )}
      </div>

      <div className="px-4 py-3">
        {item.type === "text" ? (
          <>
            <pre className="max-h-48 overflow-auto font-mono text-sm whitespace-pre-wrap break-words text-ink">
              {item.content}
            </pre>
            <button
              onClick={copy}
              className="mt-3 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-accent-dark active:translate-y-px"
            >
              {copied ? "✓ Tersalin!" : "⧉ Salin teks"}
            </button>
          </>
        ) : (
          <>
            {isImage && (
              <img
                src={item.url}
                alt={item.fileName}
                className="mb-3 max-h-64 w-full rounded object-contain bg-paper"
                loading="lazy"
              />
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{item.fileName}</p>
                <p className="font-mono text-xs text-ink-soft">{fmtSize(item.fileSize)}</p>
              </div>
              <a
                href={item.url}
                download={item.fileName}
                className="shrink-0 rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-800 active:translate-y-px"
              >
                ⬇ Unduh
              </a>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
