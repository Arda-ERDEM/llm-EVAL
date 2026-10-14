# Eval Corpus

Bu dizin, mini değerlendirme (eval) için kullanılan 5 adet gerçek dünya hukuki sözleşmesini içerir:

| ID | Başlık | Doküman Türü | Dil | Karakter Sayısı | Satır Sayısı | Kaynak URL |
|---|---|---|---|---|---|---|
| `spotify_us_tos` | Spotify Terms of Use (US) | Kullanım & Abonelik Koşulları | EN | 55.021 | 168 | [spotify.com/us/legal](https://www.spotify.com/us/legal/end-user-agreement/) |
| `spotify_tr_tos` | Spotify Kullanıcı Sözleşmesi (TR) | Kullanım & Abonelik Koşulları | TR | 44.710 | 150 | [spotify.com/tr/legal](https://www.spotify.com/tr/legal/end-user-agreement/) |
| `reddit_ua` | Reddit User Agreement | Kullanıcı Sözleşmesi | EN | 69.957 | 933 | [redditinc.com/policies](https://www.redditinc.com/policies/user-agreement) |
| `dropbox_tos` | Dropbox Terms of Service | Bulut Depolama & Abonelik | EN | 25.303 | 97 | [dropbox.com/terms](https://www.dropbox.com/terms) |
| `spotify_privacy` | Spotify Privacy Policy | Gizlilik Politikası | EN | 40.704 | 572 | [spotify.com/us/legal/privacy](https://www.spotify.com/us/legal/privacy-policy/) |

Her doküman için üç dosya mevcuttur:
- `<id>.html`: Çekilen orijinal ham HTML sayfası
- `<id>.txt`: Blok düzeyinde temizlenmiş, gürültüsüz (navigasyon/script/reklamlar arındırılmış) düz metin
- `<id>.meta.json`: Çekilme tarihi, kaynak URL ve boyut metaverileri
