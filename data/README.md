# Data Demo Asset Borrow

Folder ini berisi data yang bisa ditunjukkan ke dosen.

| Path | Isi |
|---|---|
| `data/ledger.json` | Ledger utama: aset, permintaan, record hash, memo, dan status transaksi |
| `data/uploads/` | File gambar aset asli (PNG/JPG/WEBP/GIF/AVIF) |

Transaksi baru dikirim ke **Solana Devnet** lewat Memo Program. Setelah Phantom
mengonfirmasi, record di `data/ledger.json` akan punya `tx.signature`,
`tx.slot`, `tx.blockTime`, dan `tx.explorerUrl`.

Kalau Phantom menolak atau transaksi gagal, record tetap tersimpan lokal dengan
`tx: null`. Buka detail aset, lalu klik **Anchor ke Devnet** untuk mencoba lagi
tanpa membuat record baru.

## Cara membuktikan

1. Jalankan aplikasi dengan `npm run dev`.
2. Hubungkan Phantom yang berada di jaringan **Devnet** dan punya saldo SOL Devnet.
3. Buka halaman **Bukti Data** di `/bukti`.
4. Tambah aset + foto dari **Dasbor Admin**, lalu setujui transaksi di Phantom.
5. Buka `data/ledger.json`; record baru akan muncul di array `records` dengan `tx` terisi.
6. Buka `data/uploads/`; file gambar baru akan muncul di folder itu.
7. Klik tautan hash/signature di kolom **On-chain** atau halaman detail aset untuk
   membuka Solana Explorer Devnet.
8. Kalau `tx` masih `null`, buka detail aset dan klik **Anchor ke Devnet**.

## Reset data

- Klik **Reset seed** di halaman `/bukti`, atau
- Hapus `data/ledger.json`, lalu muat ulang aplikasi. Server akan menyalin ulang dari
  `src/data/ledger.json`.

## Catatan

Penyimpanan ini memakai filesystem lokal. Cocok untuk demo di laptop. Kalau aplikasi
di-deploy ke Cloudflare, file lokal tidak bisa ditulis; gunakan object storage/database
untuk produksi.

Skema lengkap ada di `docs/skema-ledger.json` dan penjelasannya di
`docs/skema-ledger.md`.
