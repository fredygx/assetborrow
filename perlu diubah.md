# Perlu Diubah — Catatan Revisi Rencana UTS

**Konteks:** informasi dari asdos — **mitra/narasumber tidak wajib**.
**Status:** catatan revisi. `uts.md` **belum** diubah; dokumen ini daftar perbaikannya.
**Asumsi pencatatan:** yang dimaksud "tidak perlu mitra" adalah tidak wajib mewawancarai produsen/pedagang. Sumber pengetahuan boleh dari literatur, dokumentasi, dan observasi. Kalau maksud asdos berbeda, koreksi bagian 1.

---

## 1. Keputusan yang Berubah

| Hal | Rencana awal di `uts.md` | Setelah info asdos | Tindakan |
|---|---|---|---|
| Mitra/narasumber | 3–5 narasumber, wajib ditemui | Tidak wajib | Hapus blocker narasumber |
| Sumber pengetahuan | Wawancara semi-terstruktur | Literatur, dokumentasi, observasi | Tulis ulang §2 |
| Consent form | Wajib sebelum wawancara | Hanya jika ada manusia yang dilibatkan | Sesuaikan §2.3 |
| Panel komunitas | Panelis nyata dari komunitas | Simulasi peran panel | Jelaskan sebagai simulasi |
| Linimasa | 2 hari mencari narasumber | 2 hari studi literatur | Sesuaikan §13 |
| Lampiran | Consent form | Daftar pustaka + bukti dokumen | Sesuaikan §15 |

**Dasar dari brief:** bagian 4A menyebut sumber boleh berupa "wawancara, observasi, dokumentasi, atau literatur yang dapat dipertanggungjawabkan". Jadi tanpa mitra **tetap sesuai**, asalkan sumbernya jelas dan bisa dilacak. Kalimat "utamakan calon narasumber nyata" di brief bersifat rekomendasi, bukan syarat wajib.

---

## 2. Perubahan per Bagian `uts.md`

| Prioritas | Bagian | Kondisi sekarang | Diubah menjadi |
|---|---|---|---|
| P0 | Halaman depan | Lokasi & anggota masih placeholder | Isi komoditas final, daerah, nama + NIM |
| P0 | §2.1 | Tabel narasumber (2 pengrajin, 1 petani, dst.) | Tabel **sumber pengetahuan**: SNI, jurnal, dokumen kelompok/desa, observasi pasar |
| P0 | §2.2 | Wawancara + observasi + dokumentasi | Studi literatur + dokumentasi + observasi; hapus klaim wawancara |
| P0 | §3 | Tabel indikator tanpa kolom sumber | Tambah tabel pendukung: indikator → sumber → kutipan → tingkat keyakinan |
| P0 | §4.2, §4.4 | Ambang masih "usulan" | Ganti dengan angka SNI/lab + cantumkan sumbernya |
| P0 | §14 | Blocker "minimal 3 narasumber" | Ganti dengan "minimal 5 referensi kredibel" |
| P1 | §2.3 | Etika wawancara & consent | Etika data sekunder: tidak menuduh, tidak menyebut merek/produsen, atribusi sumber |
| P1 | §7 | Panel komunitas seolah nyata | Sebut sebagai **simulasi peran**; jelaskan batasannya di laporan |
| P1 | §12 | Jawaban no. 2 menyebut pemilik pengetahuan | Ganti: sumber literatur/dokumentasi, bukan klaim wawancara |
| P1 | §13 | Ada hari untuk mencari narasumber | Alihkan ke studi literatur dan pengumpulan dokumen |
| P2 | §9 | 8 skenario uji | Tambah 1 skenario: sumber/rujukan tidak lengkap → NEEDS_REVIEW |
| P2 | §15 | Consent form | Daftar pustaka, screenshot dokumen, tabel observasi |

---

## 3. Yang Tidak Perlu Diubah

- Struktur tabel wajib 5 kolom (sudah 6 baris, syarat minimal 5).
- §5 arsitektur AI + blockchain.
- §6 pseudocode smart contract dan pembagian peran.
- §8 halaman prototipe + format QR.
- §9 skenario uji (kecuali tambahan satu baris).
- §10 keterbatasan.
- §11 pemetaan rubrik.
- Alur pra-verifikasi sebelum on-chain dan mekanisme sengketa.

---

## 4. Dampak ke Rubrik

| Komponen | Bobot | Dampak | Mitigasi |
|---|---|---|---|
| Kedalaman pengetahuan lokal | 20% | **Paling terpukul** — tidak ada data primer | 5+ referensi kredibel, kutipan langsung, triangulasi, tabel sumber per indikator |
| Kualitas aturan verifikasi | 20% | Tidak berubah | Pastikan ambang bersumber, bukan karangan |
| Integrasi AI & blockchain | 20% | Tidak berubah | Tetap seperti rancangan |
| Prototipe & pengujian | 15% | Tidak berubah | Simulasi tetap diterima |
| Laporan, etika, presentasi | 10% | Sedikit lebih mudah | Etika data sekunder tetap dijelaskan |
| Masalah & studi kasus | 15% | Perlu bukti masalah | Dukung dengan data/berita/literatur, bukan asumsi |

---

## 5. Risiko Baru dan Cara Menutupnya

| Risiko | Tanda bahaya | Mitigasi |
|---|---|---|
| Dianggap mengarang pengetahuan lokal | Tidak ada sitasi, kalimat "menurut pengrajin" tanpa sumber | Setiap indikator punya sumber tertulis; hapus klaim wawancara |
| Pengetahuan lokal jadi generik | Indikator bisa berlaku untuk produk apa saja | Pakai ciri khas daerah + istilah lokal + contoh spesifik |
| Panel komunitas dianggap fiktif | Ditulis seolah benar-benar mengesahkan | Labeli "simulasi peran"; jelaskan siapa yang akan mengisi peran itu |
| Data AI tidak ada | Mengklaim akurasi | Akui dataset kecil; AI hanya indikasi awal |
| Angka ambang salah | Kadar air/gula reduksi tanpa rujukan | Kutip SNI/lab; kalau tidak ada, tulis "perlu validasi" |

---

## 6. Checklist Sebelum Edit `uts.md`

- [ ] Konfirmasi ke asdos: panel komunitas boleh disimulasikan?
- [ ] Konfirmasi: literatur + dokumentasi cukup untuk komponen 20%?
- [ ] Tetapkan komoditas final (gula kelapa atau lain)
- [ ] Kumpulkan minimal 5 referensi kredibel
- [ ] Catat sumber untuk setiap indikator
- [ ] Ganti semua angka "usulan" dengan angka bersumber
- [ ] Putuskan mode blockchain (simulasi hash chain / testnet)
- [ ] Edit `uts.md` sesuai tabel §2
- [ ] Baru bangun prototipe di branch terpisah

---

## 7. Pertanyaan untuk Asdos/Dosen

1. Apakah pengesahan komunitas boleh berupa simulasi peran, atau harus ada pihak nyata yang menandatangani?
2. Apakah sumber literatur + dokumentasi saja cukup untuk bagian pengetahuan lokal (20%)?
3. Apakah ada format tabel/laporan khusus yang harus diikuti?
4. Apakah prototipe simulasi hash chain diterima, atau wajib smart contract di testnet?
5. Apakah nama produk/daerah boleh disamarkan?

---

## 8. Catatan

- Info "tidak perlu mitra" saat ini bersifat lisan. Sebaiknya minta konfirmasi tertulis (chat/email) agar tidak berubah saat penilaian.
- Kalau yang dimaksud asdos hanya "tidak perlu mitra industri" tetapi wawancara narasumber tetap disarankan, bagian §2 cukup dikembalikan ke rencana awal.
- Jangan menghapus bagian etika sepenuhnya. Tanpa narasumber, etika tetap berlaku untuk data sekunder: jangan menuduh produsen tertentu, jangan menyebarkan data pribadi, dan cantumkan atribusi.
