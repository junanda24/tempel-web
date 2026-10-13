// API layer — kontrak sesuai api-contract.md.
// MODE otomatis: "real" (Supabase) bila env tersedia, fallback "mock" (localStorage).

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const MODE = SUPABASE_URL && SUPABASE_ANON_KEY ? "real" : "mock";

const LS_KEY = "tempel:rooms:v1";
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_TEXT = 100_000;
const MAX_FILE = 10 * 1024 * 1024;
const BUCKET = "tempel-files";

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const nowIso = () => new Date().toISOString();
export const normalizeCode = (c = "") =>
  c.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
export const isValidCode = (c = "") => /^[a-z0-9-]{3,24}$/.test(c);
export const MAX_FILE_BYTES = MAX_FILE;
export const apiMode = MODE;

/* ---------------- ANALYTICS (Tahap 6, anonim) ----------------
   Hanya simpan tipe event + timestamp. Tanpa konten, tanpa kode room, tanpa IP.
   Fire-and-forget: tidak pernah blokir UI, gagal diam-diam. */
export function track(type) {
  if (MODE !== "real") return;
  try {
    sb.from("events").insert({ type }).then(() => {}, () => {});
  } catch {
    /* abaikan */
  }
}

/* ---------------- MOCK ADAPTER (localStorage, fallback dev) ---------------- */
function loadRooms() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveRooms(r) {
  localStorage.setItem(LS_KEY, JSON.stringify(r));
}
function prune(rooms) {
  const now = Date.now();
  for (const k of Object.keys(rooms)) {
    if (new Date(rooms[k].expiresAt).getTime() <= now) delete rooms[k];
  }
  return rooms;
}
const latency = () => new Promise((r) => setTimeout(r, 250));

const mock = {
  async openRoom(rawCode) {
    await latency();
    const code = normalizeCode(rawCode);
    if (!isValidCode(code)) throw new Error("Kode room 3–24 karakter (huruf, angka, strip).");
    const rooms = prune(loadRooms());
    if (!rooms[code]) {
      rooms[code] = {
        code,
        expiresAt: new Date(Date.now() + ROOM_TTL_MS).toISOString(),
        items: [],
      };
      saveRooms(rooms);
    }
    return { code, expiresAt: rooms[code].expiresAt };
  },
  async getRoom(rawCode) {
    await latency();
    const code = normalizeCode(rawCode);
    const rooms = prune(loadRooms());
    const room = rooms[code];
    if (!room) throw new Error("Room tidak ditemukan atau sudah kedaluwarsa.");
    return { ...room, items: [...room.items].reverse() };
  },
  async addText(rawCode, content) {
    await latency();
    const code = normalizeCode(rawCode);
    if (!content.trim()) throw new Error("Teks kosong.");
    if (content.length > MAX_TEXT) throw new Error("Teks maksimal 100.000 karakter.");
    const rooms = prune(loadRooms());
    const room = rooms[code];
    if (!room) throw new Error("Room tidak ditemukan.");
    const item = { id: uid(), type: "text", content, createdAt: nowIso() };
    room.items.push(item);
    saveRooms(rooms);
    return item;
  },
  async uploadFile(rawCode, file) {
    const code = normalizeCode(rawCode);
    if (file.size > MAX_FILE) throw new Error("File maksimal 10 MB.");
    const rooms = prune(loadRooms());
    const room = rooms[code];
    if (!room) throw new Error("Room tidak ditemukan.");
    const dataUrl = await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
    await latency();
    const item = {
      id: uid(),
      type: "file",
      fileName: file.name,
      fileSize: file.size,
      mime: file.type || "application/octet-stream",
      url: dataUrl,
      createdAt: nowIso(),
    };
    const fresh = prune(loadRooms());
    if (!fresh[code]) throw new Error("Room tidak ditemukan.");
    fresh[code].items.push(item);
    saveRooms(fresh);
    return item;
  },
  async deleteItem(rawCode, id) {
    await latency();
    const code = normalizeCode(rawCode);
    const rooms = prune(loadRooms());
    const room = rooms[code];
    if (!room) throw new Error("Room tidak ditemukan.");
    room.items = room.items.filter((i) => i.id !== id);
    saveRooms(rooms);
    return { ok: true };
  },
};

/* ---------------- REAL ADAPTER (Supabase) ---------------- */
const sb = MODE === "real"
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const toItem = (row) => ({
  id: row.id,
  type: row.kind,
  content: row.content,
  fileName: row.file_name,
  fileSize: row.file_size,
  mime: row.mime_type,
  url: row.file_path
    ? sb.storage.from(BUCKET).getPublicUrl(row.file_path).data.publicUrl
    : undefined,
  createdAt: row.created_at,
});
const EXPIRED_MSG = "Room tidak ditemukan atau sudah kedaluwarsa.";

const real = {
  async openRoom(rawCode) {
    const code = normalizeCode(rawCode);
    if (!isValidCode(code))
      throw new Error("Kode room 3–24 karakter (huruf, angka, strip).");
    const { data: existing } = await sb
      .from("rooms")
      .select("code, expires_at")
      .eq("code", code)
      .maybeSingle();
    if (existing) {
      if (new Date(existing.expires_at).getTime() <= Date.now()) {
        await sb.from("rooms").delete().eq("code", code);
      } else {
        return { code, expiresAt: existing.expires_at };
      }
    }
    const expiresAt = new Date(Date.now() + ROOM_TTL_MS).toISOString();
    const { error } = await sb.from("rooms").insert({ code, expires_at: expiresAt });
    if (error) throw new Error("Gagal membuat room: " + error.message);
    track("room_opened");
    return { code, expiresAt };
  },

  async getRoom(rawCode) {
    const code = normalizeCode(rawCode);
    const { data: room, error: roomErr } = await sb
      .from("rooms")
      .select("code, expires_at")
      .eq("code", code)
      .maybeSingle();
    if (roomErr) throw new Error("Gagal memuat room: " + roomErr.message);
    if (!room) throw new Error(EXPIRED_MSG);
    if (new Date(room.expires_at).getTime() <= Date.now()) {
      // Bersihkan file storage dulu (Storage API), baru hapus room (cascade hapus items).
      const { data: doomed } = await sb
        .from("items")
        .select("file_path")
        .eq("room_code", code)
        .not("file_path", "is", null);
      const paths = (doomed || []).map((r) => r.file_path).filter(Boolean);
      if (paths.length) await sb.storage.from(BUCKET).remove(paths);
      await sb.from("rooms").delete().eq("code", code);
      throw new Error(EXPIRED_MSG);
    }
    const { data: rows, error: itemErr } = await sb
      .from("items")
      .select("*")
      .eq("room_code", code)
      .order("created_at", { ascending: false });
    if (itemErr) throw new Error("Gagal memuat item: " + itemErr.message);
    return { code, expiresAt: room.expires_at, items: (rows || []).map(toItem) };
  },

  async addText(rawCode, content) {
    const code = normalizeCode(rawCode);
    if (!content.trim()) throw new Error("Teks kosong.");
    if (content.length > MAX_TEXT)
      throw new Error("Teks maksimal 100.000 karakter.");
    const { data, error } = await sb
      .from("items")
      .insert({ room_code: code, kind: "text", content })
      .select()
      .single();
    if (error) throw new Error("Gagal menyimpan teks: " + error.message);
    track("text_added");
    return toItem(data);
  },

  async uploadFile(rawCode, file) {
    const code = normalizeCode(rawCode);
    if (file.size > MAX_FILE) throw new Error("File maksimal 10 MB.");
    const fileId = uid();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "file";
    const path = `${code}/${fileId}/${safeName}`;
    const { error: upErr } = await sb.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || "application/octet-stream" });
    if (upErr) throw new Error("Gagal mengunggah file: " + upErr.message);
    const { data, error } = await sb
      .from("items")
      .insert({
        room_code: code,
        kind: "file",
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
      })
      .select()
      .single();
    if (error) {
      await sb.storage.from(BUCKET).remove([path]);
      throw new Error("Gagal menyimpan file: " + error.message);
    }
    track("file_uploaded");
    return toItem(data);
  },

  async deleteItem(rawCode, id) {
    const code = normalizeCode(rawCode);
    const { data: row } = await sb
      .from("items")
      .select("file_path")
      .eq("id", id)
      .eq("room_code", code)
      .maybeSingle();
    if (row?.file_path) {
      await sb.storage.from(BUCKET).remove([row.file_path]);
    }
    const { error } = await sb
      .from("items")
      .delete()
      .eq("id", id)
      .eq("room_code", code);
    if (error) throw new Error("Gagal menghapus: " + error.message);
    track("item_deleted");
    return { ok: true };
  },
};

export const api = MODE === "mock" ? mock : real;
