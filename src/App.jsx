import { useCallback, useEffect, useState } from "react";
import { api, normalizeCode, isValidCode } from "./lib/api.js";
import RoomEntry from "./components/RoomEntry.jsx";
import RoomView from "./components/RoomView.jsx";

const codeFromHash = () => {
  const m = location.hash.match(/#r=([a-z0-9-]{3,24})/i);
  return m ? normalizeCode(m[1]) : "";
};

export default function App() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const openRoom = useCallback(async (c) => {
    setBusy(true);
    setError("");
    try {
      const room = await api.openRoom(c);
      setCode(room.code);
      location.hash = `r=${room.code}`;
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, []);

  // Deep link: #r=junan123 langsung buka room
  useEffect(() => {
    const c = codeFromHash();
    if (c && isValidCode(c)) openRoom(c);
    const onHash = () => {
      const h = codeFromHash();
      setCode((prev) => (h !== prev ? h : prev));
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [openRoom]);

  const leave = () => {
    setCode("");
    location.hash = "";
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      {error && !code && (
        <div className="mx-auto mt-4 w-full max-w-2xl px-5">
          <p role="alert" className="rounded-lg border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        </div>
      )}
      {code ? (
        <RoomView code={code} onLeave={leave} />
      ) : (
        <RoomEntry onOpen={openRoom} busy={busy} />
      )}
    </div>
  );
}
