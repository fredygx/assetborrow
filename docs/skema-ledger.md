# Skema Ledger Asset Borrow

Dokumen ini menjelaskan `docs/skema-ledger.json` dan contoh datanya di
`src/data/ledger.json`. Skema ini sudah dipakai oleh store, API server lokal, dan UI.

## 1. Tujuan

Menyatukan dua hal dalam satu format:

1. **State off-chain** — daftar aset, permintaan, dan snapshot data saat event terjadi.
2. **Jejak on-chain** — satu record = satu memo Solana, lengkap dengan hash, `prevHash`,
   signature, dan link Explorer.

Data pribadi (nama, telepon, foto) tetap off-chain. Yang dikirim ke Solana hanya
ID, hash, wallet, waktu, dan jenis event.

## 2. Lokasi File

| Path                     | Fungsi                                                                          |
| ------------------------ | ------------------------------------------------------------------------------- |
| `data/ledger.json`       | **File live** yang dibaca/ditulis aplikasi. Ini yang ditunjukkan ke dosen.      |
| `src/data/ledger.json`   | Data seed untuk reset. Disalin ke `data/ledger.json` kalau file live belum ada. |
| `data/uploads/`          | File gambar aset asli (PNG/JPG/WEBP/GIF/AVIF).                                  |
| `docs/skema-ledger.json` | JSON Schema.                                                                    |
| `docs/skema-ledger.md`   | Dokumen ini.                                                                    |

Foto disimpan sebagai file di `data/uploads/`, bukan base64 di JSON. URL yang dicatat
di ledger berbentuk `/api/uploads/<nama-file>`, dan file dilayani oleh server lokal.

## 3. Struktur File

| Field                     | Isi                                                              |
| ------------------------- | ---------------------------------------------------------------- |
| `schemaVersion`           | Versi skema, sekarang `1.0.0`                                    |
| `app`                     | Selalu `asset-borrow`                                            |
| `network`                 | `simulasi`, `localnet`, `devnet`, `testnet`, atau `mainnet-beta` |
| `program`                 | `{ type: "simulasi" \| "memo" \| "anchor", id: "..." }`          |
| `hashAlgorithm`           | `sha256`                                                         |
| `canonicalization`        | `json-sort-keys-v1`                                              |
| `createdAt` / `updatedAt` | Waktu ISO 8601 dengan timezone                                   |
| `lastHash`                | Hash record terakhir, `null` kalau kosong                        |
| `assets`                  | State aset saat ini                                              |
| `requests`                | State permintaan saat ini                                        |
| `records`                 | Riwayat event, urut naik berdasarkan `seq`                       |

Contoh root:

```json
{
  "schemaVersion": "1.0.0",
  "app": "asset-borrow",
  "network": "devnet",
  "program": { "type": "memo", "id": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr" },
  "hashAlgorithm": "sha256",
  "canonicalization": "json-sort-keys-v1",
  "createdAt": "2026-10-05T10:15:00+07:00",
  "updatedAt": "2026-10-08T08:00:00+07:00",
  "lastHash": "sha256:9be0b1f818508c377e051a772b9f66a35df3f6ad452b233fb32cfdbee1828be8",
  "assets": [],
  "requests": [],
  "records": []
}
```

## 4. Bentuk Record

Setiap record memakai field yang sama. Field opsional tetap ditulis sebagai `null`
agar bentuk hash-nya stabil.

```json
{
  "id": "LOG-0006",
  "seq": 6,
  "type": "AGREEMENT_SIGN",
  "assetId": "AST-001",
  "requestId": "REQ-101",
  "actorWallet": "9aRbF3kPq2mZxW8yLtN5vC6hJ4dEuS1oGiY7nBQr2kLm",
  "timestamp": "2026-10-06T09:12:00+07:00",
  "prevHash": "sha256:...",
  "salt": "9f2c41d7a8b3e6f05c1d9a7b2e4f8c60",
  "hash": "sha256:...",
  "assetStatusBefore": "Tersedia",
  "assetStatusAfter": "Dipinjam",
  "requestStatusBefore": "Menunggu",
  "requestStatusAfter": "Ditandatangani",
  "offchain": {
    "asset": {
      "id": "AST-001",
      "nama": "...",
      "kondisi": "Baik",
      "kategori": "Audio Visual",
      "status": "Dipinjam"
    },
    "request": {
      "id": "REQ-101",
      "assetId": "AST-001",
      "peminjam": "...",
      "telepon": "...",
      "status": "Ditandatangani",
      "createdAt": "..."
    }
  },
  "memo": {
    "v": 1,
    "app": "asset-borrow",
    "evt": "AGREEMENT_SIGN",
    "asset": "AST-001",
    "req": "REQ-101",
    "hash": "sha256:...",
    "prev": "sha256:...",
    "actor": "9aRbF3kPq2mZxW8yLtN5vC6hJ4dEuS1oGiY7nBQr2kLm",
    "ts": "2026-10-06T09:12:00+07:00"
  },
  "tx": null
}
```

`tx` berisi bukti transaksi setelah dikirim:

```json
{
  "signature": "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW",
  "slot": 348721234,
  "blockTime": 1760000000,
  "status": "confirmed",
  "explorerUrl": "https://explorer.solana.com/tx/5VER...?cluster=devnet"
}
```

Selama `network: "simulasi"` atau sebelum transaksi dikirim, `tx` bernilai `null`.

## 5. Aturan Hash

Hash record dihitung dari **record tanpa field `hash`, `memo`, dan `tx`**:

```text
id, seq, type, assetId, requestId, actorWallet, timestamp, prevHash, salt,
assetStatusBefore, assetStatusAfter, requestStatusBefore, requestStatusAfter,
offchain
```

Langkahnya:

1. Ambil objek record, buang `hash`, `memo`, dan `tx`.
2. Urutkan key setiap objek secara leksikografis (rekursif). Urutan array tidak diubah.
3. `JSON.stringify` tanpa spasi, encode UTF-8.
4. Hitung SHA-256, tulis sebagai `sha256:<64 hex huruf kecil>`.

`prevHash` adalah hash record sebelumnya. Record pertama memakai `null`.
Dengan begitu, mengubah satu record lama akan memutus rantai hash.

Field `offchain` ikut di-hash. Artinya hash on-chain juga mengikat snapshot data
off-chain saat event terjadi, tanpa perlu mengirim isi snapshot itu ke Solana.

`salt` adalah nonce acak 16 byte (32 karakter hex) yang **hanya disimpan off-chain**
dan tidak dimasukkan ke memo. Fungsinya mencegah orang menebak nama/nomor telepon
dari hash publik dengan mencoba daftar kata atau nomor. Tanpa salt, hash PII yang
pendek bisa di-brute-force. Simpan salt di file ini; kalau salt hilang, hash tidak
bisa diverifikasi ulang.

## 6. Aturan Memo

`record.memo` adalah payload yang dikirim ke Memo Program. Bentuknya sengaja pendek:

```json
{
  "v": 1,
  "app": "asset-borrow",
  "evt": "AGREEMENT_SIGN",
  "asset": "AST-001",
  "req": "REQ-101",
  "hash": "sha256:...",
  "prev": "sha256:...",
  "actor": "9aRb...",
  "ts": "2026-10-06T09:12:00+07:00"
}
```

- `hash` harus sama dengan `record.hash`.
- `prev` harus sama dengan `record.prevHash`.
- `req` bernilai `null` untuk `ASSET_REGISTER`.
- Ukuran payload saat ini ±300–350 byte, masih di bawah batas memo Solana (±566 byte).
- Memo disimpan di riwayat transaksi, bukan di akun state. Untuk query state,
  nanti kita butuh indexer atau Anchor PDA.

## 7. Pemetaan Event

| Event             | Aksi UI                         | Status aset                 | Status request                | `requestId` |
| ----------------- | ------------------------------- | --------------------------- | ----------------------------- | ----------- |
| `ASSET_REGISTER`  | Tambah aset                     | `null` → `Tersedia`         | `null` → `null`               | `null`      |
| `BORROW_REQUEST`  | Buat permintaan                 | tetap                       | `null` → `Menunggu`           | wajib       |
| `AGREEMENT_SIGN`  | Tanda tangani                   | `Tersedia` → `Dipinjam`     | `Menunggu` → `Ditandatangani` | wajib       |
| `ASSET_RETURN`    | Tandai kembali                  | `Dipinjam` → `Dikembalikan` | `Ditandatangani` → `Selesai`  | wajib       |
| `ASSET_ARCHIVE`   | Hapus aset (arsip)              | `Tersedia`/`Dikembalikan` → `Diarsipkan` | tetap             | `null`      |
| `DISPUTE_OPEN`    | Sengketa (belum ada UI)         | bebas                       | bebas                         | opsional    |
| `DISPUTE_RESOLVE` | Sengketa selesai (belum ada UI) | bebas                       | bebas                         | opsional    |

Hash di state saat ini mengikuti aturan:

- `asset.hash` = hash record terakhir yang **mengubah status aset**
  (`ASSET_REGISTER`, `AGREEMENT_SIGN`, `ASSET_RETURN`, `ASSET_ARCHIVE`).
- `request.hash` = hash record terakhir yang **mengubah status request**
  (`BORROW_REQUEST`, `AGREEMENT_SIGN`, `ASSET_RETURN`).
- `lastHash` = hash record terakhir di array `records`.

`ASSET_ARCHIVE` adalah soft delete: aset tetap tersimpan di ledger dengan status
`Diarsipkan` agar hash chain dan riwayat tetap valid. Aset yang sedang dipinjam
atau masih punya permintaan aktif tidak bisa diarsipkan. Tidak ada penghapusan
fisik dari `data/ledger.json`.

## 8. On-Chain vs Off-Chain

| Data                                               | Lokasi                     | Alasan                                                 |
| -------------------------------------------------- | -------------------------- | ------------------------------------------------------ |
| `nama`, `peminjam`, `telepon`, `foto`              | Off-chain                  | Data pribadi; memo Solana bersifat publik dan permanen |
| `assets`, `requests`, `offchain`                   | Off-chain                  | State aplikasi dan snapshot                            |
| `hash`, `prevHash`                                 | On-chain (di memo)         | Bukti integritas dan urutan                            |
| `salt`                                             | Off-chain                  | Mencegah brute-force PII dari hash publik              |
| `assetId`, `requestId`, `actorWallet`, `timestamp` | On-chain (di memo)         | Metadata minimum untuk audit                           |
| `tx.signature`, `slot`, `blockTime`                | On-chain (hasil transaksi) | Bukti transaksi di Explorer                            |

Jangan pernah menaruh nama, nomor telepon, foto, atau isi perjanjian di memo.
Kalau foto perlu diikat, simpan `fotoHash` (SHA-256 byte foto) di snapshot, bukan
data URL-nya.

## 9. Konfigurasi Jaringan

**Devnet + Memo Program (aktif sekarang):**

```json
"network": "devnet",
"program": {
  "type": "memo",
  "id": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
}
```

**Simulasi (mode lama, tidak dipakai lagi):**

```json
"network": "simulasi",
"program": { "type": "simulasi", "id": "simulasi" }
```

**Anchor (nanti):**

```json
"network": "devnet",
"program": { "type": "anchor", "id": "<PROGRAM_ID>" }
```

Skema ini adalah **mirror ledger + payload memo**. Kalau memakai Anchor, skema akun
PDA (state on-chain) perlu dibuat terpisah; jangan menaruh data pribadi di PDA.

## 10. Validasi

Contoh data sudah lolos:

- validasi struktur terhadap `docs/skema-ledger.json`;
- pengecekan `seq` berurutan;
- pengecekan `prevHash` menyambung;
- pengecekan ulang SHA-256 setiap record (termasuk `salt`);
- pengecekan `memo.hash`/`memo.prev` sama dengan record;
- pengecekan `lastHash` dan hash aset/request.

Untuk validasi schema dari terminal:

```sh
npx --yes -p ajv-cli@5 -p ajv-formats ajv validate -s docs/skema-ledger.json -d data/ledger.json --spec=draft7 -c ajv-formats
```

## 11. Mapping dari Store Saat Ini

| Store sekarang              | Skema baru                       | Catatan                                               |
| --------------------------- | -------------------------------- | ----------------------------------------------------- |
| `Asset.hash` (`0x...`)      | `asset.hash` (`sha256:...`)      | Ganti generator hash lama dengan SHA-256              |
| `Asset.foto`                | `asset.foto` + `asset.fotoHash`  | Foto tetap off-chain; `fotoHash` opsional             |
| `Request.tanggal` / `waktu` | `request.createdAt` / `signedAt` | Simpan ISO 8601, format tampilan di UI                |
| `Request.wallet`            | `request.wallet`                 | Wallet penanda tangan                                 |
| `Log.waktu`                 | `record.timestamp`               | ISO 8601                                              |
| `Log.aksi`                  | `record.type`                    | Pakai enum event, bukan teks bebas                    |
| `Log.wallet`                | `record.actorWallet`             | Wallet pelaku                                         |
| `Log.status`                | `record.assetStatusAfter`        | Status aset setelah event                             |
| `Log.hash`                  | `record.hash`                    | Hash SHA-256 record                                   |
| (belum ada)                 | `record.salt`                    | Dibuat acak 16 byte saat record baru; tetap off-chain |

## 12. Catatan Implementasi

- Browser tidak bisa menulis file langsung. Aplikasi memakai API server lokal:
  - `GET /api/ledger` membaca `data/ledger.json`;
  - `POST /api/ledger-action` menghitung record + hash lalu menulis file;
  - `POST /api/ledger-tx` menyimpan signature + slot + blockTime ke record;
  - `POST /api/upload` menulis foto ke `data/uploads/`;
  - `GET /api/uploads/<file>` menyajikan foto.
- Store memuat ledger dari API dan memakai hash SHA-256. Aksi `addAsset`,
  `createRequest`, `signRequest`, `returnAsset`, dan `archiveAsset` sudah async:
  record lokal ditulis dulu, lalu Phantom menandatangani transaksi memo Devnet,
  lalu `tx` diisi dari signature yang dikonfirmasi.
- Phantom dipanggil lewat `provider.request({ method: "signTransaction",
params: { message: bs58.encode(await transaction.serialize({ requireAllSignatures: false, verifySignatures: false })) } })`.
  Phantom 26.35.0 mendekode `params.message` sebagai **transaksi utuh**, bukan
  hanya `serializeMessage()`. Transaksi yang sudah ditandatangani dikirim ke RPC
  Devnet lewat `connection.sendRawTransaction`. Fallback
  `signAndSendTransaction` dan method provider lama tetap tersedia untuk wallet
  yang tidak menyediakan `request`.
- Syarat demo on-chain: Phantom di jaringan **Devnet** dan punya saldo SOL Devnet
  untuk fee. Kalau wallet belum terhubung atau transaksi ditolak, record tetap
  tersimpan lokal dengan `tx: null`; UI menampilkan peringatan, bukan klaim on-chain.
- Record dengan `tx: null` bisa di-anchor ulang dari halaman detail aset
  (`Anchor ke Devnet`). Anchor memakai `record.memo` yang sudah tersimpan, jadi
  hash dan urutan rantai tidak berubah.
- Kalau transaksi on-chain gagal setelah signature terbentuk, record tetap
  `tx: null` sampai transaksi berhasil. Percobaan anchor ulang akan mengirim memo
  baru; untuk demo, pastikan Phantom tidak menolak transaksi.
- Data seed lama tetap `tx: null`. Hanya record baru (atau record yang di-anchor
  ulang) yang memiliki `tx` terisi.
- Penyimpanan file lokal cocok untuk demo di laptop. Kalau di-deploy ke Cloudflare,
  gunakan object storage (R2) atau database, karena filesystem Worker tidak persisten.
