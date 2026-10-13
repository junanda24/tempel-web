# API Contract — Tempel (Clipboard Online)

Base: `/api`. Semua response JSON. Room code: 3–24 karakter, `[a-z0-9-]`, case-insensitive (dinormalisasi ke lowercase).

## Rooms

### POST /api/rooms — buat atau buka room
Request: `{ "code": "junan123" }`
Response 200: `{ "code": "junan123", "expiresAt": "2026-10-13T09:00:00Z" }`
- Jika room belum ada → buat baru, `expiresAt = now + 24 jam`.
- Jika room sudah ada & belum kedaluwarsa → kembalikan room yang ada.
- Jika room sudah kedaluwarsa → buat baru (reset).
- Error 400: kode tidak valid. Error 429: rate limit.

### GET /api/rooms/:code — isi room
Response 200: `{ "code": "...", "expiresAt": "...", "items": [Item] }`
- Error 404: room tidak ada / sudah kedaluwarsa.

## Items

```ts
type Item =
  | { id: string; type: "text"; content: string; createdAt: string }
  | { id: string; type: "file"; fileName: string; fileSize: number; mime: string; url: string; createdAt: string };
```

### POST /api/rooms/:code/items — tambah teks
Request: `{ "type": "text", "content": "..." }` (maks 100.000 karakter)
Response 201: `Item`

### POST /api/rooms/:code/files — upload file
Request: `multipart/form-data`, field `file` (maks 10 MB)
Response 201: `Item` (type file, `url` = signed URL download)
- Error 413: file > 10 MB.

### DELETE /api/rooms/:code/items/:id — hapus item
Response 200: `{ "ok": true }`

## Expiry
Room + seluruh item & file-nya dihapus otomatis saat `expiresAt` tercapai (cleanup job per menit).
