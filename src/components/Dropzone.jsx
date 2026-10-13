import { useRef, useState } from "react";
import { MAX_FILE_BYTES } from "../lib/api.js";

const fmtMB = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`;

// Signature #3: dropzone khas dengan animasi drag
export default function Dropzone({ onFile, busy }) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handle = (file) => {
    setError("");
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError(`File kebesaran (${fmtMB(file.size)}). Maksimal 10 MB.`);
      return;
    }
    onFile(file);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload file, maksimal 10 MB"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center transition-all duration-200 ${
          drag ? "dropzone-active" : "border-line bg-white hover:border-zinc-400"
        }`}
      >
        <div className="text-3xl">{drag ? "📥" : "📎"}</div>
        <p className="mt-2 text-sm font-bold text-ink">
          {busy ? "Mengupload…" : drag ? "Lepaskan file di sini!" : "Klik atau seret file ke sini"}
        </p>
        <p className="mt-1 font-mono text-xs text-ink-soft">maksimal 10 MB per file</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
