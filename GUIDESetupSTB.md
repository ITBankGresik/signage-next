# Panduan Setup STB ZTE B860H sebagai Signage Player

Panduan ini untuk menjalankan Signage BPR Bank Gresik di STB ZTE B860H secara
otomatis saat boot — tanpa perlu buka browser atau ketik URL manual.

**Prasyarat:** STB sudah root / ADB aktif dan bisa install APK bebas.

## 1. Sideload Fully Kiosk Browser

Download APK Fully Kiosk Browser versi terbaru dari situs resminya (bukan versi
tidak resmi), lalu install lewat ADB:

```bash
adb connect <ip-stb>:5555
adb install FullyKioskBrowser.apk
```

## 2. Konfigurasi Start URL & Autoplay

Buka aplikasinya sekali, lalu masuk ke **Settings → Web Content Settings**:

- **Start URL**: arahkan ke URL player, misal `http://<ip-server>:3000/player/bh-1`
- **Enable Video Autoplay**: **aktifkan**. Ini penting — browser native yang
  mengizinkan autoplay + suara dari awal, jadi tidak perlu workaround apa pun
  dari sisi kode aplikasi.

## 3. Kiosk Mode & Auto-start

Masuk ke **Settings → Motion & Gesture Detection / General**:

- Matikan semua gesture/menu bar supaya tidak bisa keluar tanpa sengaja
- Aktifkan **"Start on Device Boot"**
- Aktifkan **"Keep Screen On"**, matikan screensaver/sleep

## 4. Jadikan Default Launcher

Supaya STB nyala langsung ke signage (bukan ke UI operator):

```bash
adb shell pm set-home-activity de.ozerov.fully/de.ozerov.fully.MainActivity
```

Kalau command di atas tidak jalan di firmware ini, alternatif manual: tekan
tombol Home sekali di STB → akan muncul dialog "Use as default" → pilih Fully
Kiosk Browser.

## 5. Test Reboot Penuh

Cabut listrik STB (bukan cuma restart aplikasi), lalu nyalakan lagi. Pastikan
STB benar-benar auto-boot langsung ke halaman signage tanpa sentuhan sama
sekali.

## Catatan Performa

ZTE B860H hardware-nya lawas dengan RAM terbatas. Kalau terasa berat/lag saat
transisi video atau widget (kurs refresh, polling saham tiap 5 detik), ada
opsi "mode hemat" yang bisa dibuat untuk mengurangi frekuensi polling widget
khusus di device dengan spek rendah, tanpa mengganggu layar lain yang
hardware-nya lebih kuat.
