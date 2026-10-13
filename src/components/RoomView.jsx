import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api.js";
import CountdownBadge from "./CountdownBadge.jsx";
import PasteEditor from "./PasteEditor.jsx";
import Dropzone from "./Dropzone.jsx";
import ItemCard from "./ItemCard.jsx";

export default function RoomView({ code, onLeave }) {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const r = await api.getRoom(code);
      setRoom(r);
    } catch (e) {
      setError(e.message);
    }
  }, [code]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000); // refresh ringan tiap 5 detik
    return () => clearInterval(id);
  }, [load]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handlePaste = async (text) => {
    setBusy(true);
    try {
      await api.addText(code, text);
      await load();
      showToast("Teks ditempel ✓");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file) => {
    setBusy(true);
    try {
      await api.uploadFile(code, file);
      await load();
      showToast("File diupload ✓");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteItem(code, id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const shareRoom = async () => {
    const url = `${location.origin}${location.pathname}#r=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link room tersalin ✓");
    } catch {
      prompt("Salin link room ini:", url);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-6">
      {/* Header room */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onLeave}
          className="font-mono text-xs font-bold text-ink-soft transition hover:text-ink"
        >
          ← Ganti room
        </button>
        {room && <CountdownBadge expiresAt={room.expiresAt} />}
      </div>

      <div className="mt-4 rounded-lg border border-line bg-white px-5 py-6 text-center">
        <p className="font-mono text-[11px] font-bold tracking-[0.3em] text-ink-soft uppercase">
          Room aktif
        </p>
        <h1 className="mt-1 font-mono text-4xl font-extrabold tracking-wide text-ink sm:text-5xl">
          {code}
        </h1>
        <button
          onClick={shareRoom}
          className="mt-3 rounded-lg border border-line px-4 py-2 text-sm font-bold text-ink transition hover:border-accent hover:text-accent"
        >
          ⧉ Salin link room
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {/* Aksi */}
      <div className="mt-6 space-y-4">
        <PasteEditor onPaste={handlePaste} busy={busy} />
        <Dropzone onFile={handleFile} busy={busy} />
      </div>

      {/* Daftar isi */}
      <h2 className="mt-8 font-mono text-[11px] font-bold tracking-[0.3em] text-ink-soft uppercase">
        Isi room ({room ? room.items.length : "…"})
      </h2>
      <div className="mt-3 space-y-3">
        {!room && !error && (
          <p className="py-8 text-center font-mono text-sm text-ink-soft">Memuat…</p>
        )}
        {room && room.items.length === 0 && (
          <div className="rounded-lg border border-dashed border-line bg-white px-4 py-10 text-center">
            <p className="text-2xl">📭</p>
            <p className="mt-2 text-sm font-medium text-ink-soft">
              Room masih kosong. Tempel teks atau upload file pertama di atas.
            </p>
          </div>
        )}
        {room?.items.map((item) => (
          <ItemCard key={item.id} item={item} onDelete={handleDelete} />
        ))}
      </div>

      <p className="mt-8 text-center font-mono text-[11px] text-ink-soft">
        Tempel — Clipboard Online · tanpa login · hangus 24 jam
      </p>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-ink px-5 py-3 text-sm font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
