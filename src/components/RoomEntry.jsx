import { useState } from "react";
import { normalizeCode, isValidCode } from "../lib/api.js";

// Signature #1: kode room raksasa sebagai hero
export default function RoomEntry({ onOpen, busy }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const c = normalizeCode(code);
    if (!isValidCode(c)) {
      setError("Kode 3–24 karakter: huruf, angka, strip.");
      return;
    }
    setError("");
    onOpen(c);
  };

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-2xl flex-col items-center justify-center px-5">
      <p className="font-mono text-xs font-bold tracking-[0.3em] text-ink-soft uppercase">
        Tempel — Clipboard Online
      </p>
      <h1 className="mt-4 text-center text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
        Tempel. Ketik kode.
        <br />
        <span className="text-accent">Salin di mana aja.</span>
      </h1>
      <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-ink-soft">
        Bikin room dengan kode unikmu sendiri — misal{" "}
        <span className="font-mono font-bold text-ink">junan123</span>. Siapa
        pun yang ketik kode itu bisa lihat & nambah isi. Room hangus otomatis
        24 jam.
      </p>

      <form onSubmit={submit} className="mt-8 w-full">
        <label
          htmlFor="room-code"
          className="font-mono text-[11px] font-bold tracking-[0.25em] text-ink-soft uppercase"
        >
          Kode room
        </label>
        <input
          id="room-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="junan123"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          disabled={busy}
          className="mt-2 w-full rounded-lg border-2 border-line bg-white px-5 py-4 text-center font-mono text-3xl font-extrabold tracking-wide text-ink placeholder:text-zinc-300 focus:border-accent focus:outline-none"
        />
        {error && (
          <p role="alert" className="mt-2 text-center text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-lg bg-accent px-5 py-4 text-base font-bold text-white transition hover:bg-accent-dark active:translate-y-px disabled:opacity-50"
        >
          {busy ? "Membuka…" : "Buka / Bikin Room →"}
        </button>
      </form>

      <div className="mt-10 grid w-full grid-cols-3 gap-3 text-center">
        {[
          ["⚡", "Tanpa login"],
          ["⏳", "Hangus 24 jam"],
          ["📎", "File ≤ 10 MB"],
        ].map(([icon, label]) => (
          <div key={label} className="rounded-lg border border-line bg-white px-2 py-3">
            <div className="text-xl">{icon}</div>
            <div className="mt-1 text-xs font-semibold text-ink-soft">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
