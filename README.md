# xsum - Browser Extension

Extension browser untuk meringkas informasi dari konten di X/Twitter menggunakan AI.

## 🚀 Fitur Utama

- **Ringkasan Otomatis**: Meringkas konten X/Twitter dengan bantuan AI (OpenAI GPT-3.5 atau Google Gemini)
- **Template Terstruktur**: Hasil ringkasan dalam format yang konsisten dengan point-point penting
- **Multi AI Model**: Dukungan untuk OpenAI GPT-3.5 dan Google Gemini
- **Tema Gelap/Terang**: Pilihan tema sesuai preferensi pengguna
- **Pengaturan Fleksibel**: Konfigurasi API key dan preferensi lainnya

## 📋 Cara Kerja

1. User menginstall extension browser
2. User mengakses halaman konten seseorang di X/Twitter
3. User mengklik extension browser
4. User klik tombol "Buat Ringkasan"
5. Extension akan meringkas informasi menggunakan AI
6. Hasil ringkasan ditampilkan dalam modal

## 🛠️ Instalasi

### Instalasi Manual (Developer Mode)

1. Download atau clone repository ini
2. Buka Chrome dan navigasi ke `chrome://extensions/`
3. Aktifkan "Developer mode" di pojok kanan atas
4. Klik "Load unpacked" dan pilih folder extension ini
5. Extension akan muncul di toolbar Chrome

### Konfigurasi API Key

1. Klik icon extension di toolbar
2. Klik tombol pengaturan (⚙️)
3. Pilih model AI yang diinginkan (OpenAI atau Gemini)
4. Masukkan API key yang valid
5. Klik "Validasi API Key" untuk memastikan key berfungsi
6. Simpan pengaturan

## 🔑 Mendapatkan API Key

### OpenAI API Key
1. Kunjungi [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Login atau buat akun OpenAI
3. Klik "Create new secret key"
4. Copy API key dan paste di pengaturan extension

### Google Gemini API Key
1. Kunjungi [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Login dengan akun Google
3. Klik "Create API Key"
4. Copy API key dan paste di pengaturan extension

## 📝 Format Hasil Ringkasan

Extension menghasilkan ringkasan dalam format berikut:

```
Ringkasan:
[Isi ringkasan informasi dari konten di X/Twitter]

Point penting:
- [Point penting 1]
- [Point penting 2]
- [Point penting 3]
```

## 🎨 Fitur Pengaturan

- **Model AI**: Pilih antara OpenAI GPT-3.5 atau Google Gemini
- **Tema**: Mode terang atau gelap
- **API Key**: Konfigurasi kunci API untuk model yang dipilih
- **Auto Summary**: Otomatis buat ringkasan saat membuka halaman (opsional)
- **Simpan Riwayat**: Simpan riwayat ringkasan yang telah dibuat (opsional)

## 🔧 Tech Stack

- **Frontend**: JavaScript, HTML, CSS
- **AI Models**: OpenAI GPT-3.5, Google Gemini
- **Platform**: Chrome Extension (Manifest V3)

## 📁 Struktur File

```
x-summary/
├── manifest.json          # Konfigurasi extension
├── popup.html             # Interface popup utama
├── settings.html          # Halaman pengaturan
├── background.js          # Service worker untuk API calls
├── content.js            # Script untuk ekstraksi konten
├── scripts/
│   ├── popup.js          # Logic popup
│   └── settings.js       # Logic pengaturan
├── styles/
│   ├── popup.css         # Styling popup
│   └── settings.css      # Styling pengaturan
├── icons/
│   ├── icon16.png        # Icon 16x16
│   ├── icon32.png        # Icon 32x32
│   ├── icon48.png        # Icon 48x48
│   └── icon128.png       # Icon 128x128
└── README.md
```

## 🚨 Persyaratan

- Google Chrome browser
- API key yang valid (OpenAI atau Google Gemini)
- Koneksi internet untuk API calls

## 🔒 Keamanan & Privasi

- API key disimpan secara lokal di browser
- Tidak ada data yang dikirim ke server selain API AI yang dipilih
- Konten hanya diproses untuk keperluan ringkasan

## 🐛 Troubleshooting

### Extension tidak muncul
- Pastikan Developer mode aktif di Chrome
- Reload extension di halaman `chrome://extensions/`

### API Key tidak valid
- Periksa kembali API key yang dimasukkan
- Pastikan API key memiliki akses yang diperlukan
- Coba validasi ulang di pengaturan

### Tidak bisa meringkas konten
- Pastikan berada di halaman X/Twitter
- Periksa koneksi internet
- Pastikan API key masih valid

## 📄 Lisensi

Project ini dibuat untuk keperluan edukasi dan pengembangan.

## 🤝 Kontribusi

Silakan buat issue atau pull request untuk perbaikan dan fitur baru.

---

**xsum Extension v1.0.0**  
Dibuat dengan ❤️ untuk meringkas konten X/Twitter