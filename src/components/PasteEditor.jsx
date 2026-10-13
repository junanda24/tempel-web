import { useState } from "react";

export default function PasteEditor({ onPaste, busy }) {
  const [text, setText] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onPaste(text);
    setText("");
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-line bg-white">
      <label
        htmlFor="paste-box"
        className="block border-b border-line px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.25em] text-ink-soft uppercase"
      >
        Tempel teks
      </label>
      <textarea
        id="paste-box"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Tempel teks di sini… link, catatan, kode, apa aja."
        disabled={busy}
        className="w-full resize-y bg-transparent px-4 py-3 font-mono text-sm text-ink placeholder:text-zinc-400 focus:outline-none"
      />
      <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
        <span className="font-mono text-xs text-ink-soft">
          {text.length.toLocaleString("id-ID")} karakter
        </span>
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-800 active:translate-y-px disabled:opacity-40"
        >
          {busy ? "Menyimpan…" : "Tempel →"}
        </button>
      </div>
    </form>
  );
}
