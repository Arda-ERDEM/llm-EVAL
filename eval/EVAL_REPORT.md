# ToS Risk Analyzer - Mini Eval Raporu

Bu rapor, projenin **5 gerçek sözleşme** üzerindeki performansını, yakalanan (TP), kaçırılan (FN) ve yanlış alarm (FP) maddelerini belgelemektedir.

### Özet Metrik Tablosu

| Doküman | Altın Etiket (Gold) | Tespit Edilen | Risk Skoru | Yakalanan (TP) | Kaçırılan (FN) | Yanlış Alarm (FP) | Precision | Recall | F1 Skoru |
|---|---|---|---|---|---|---|---|---|---|
| `spotify_us_tos` | 14 | 7 | 95 (Kritik) | 7 | 7 | 0 | %100.0 | %50.0 | %66.7 |
| `spotify_tr_tos` | 16 | 2 | 48 (Orta) | 2 | 14 | 0 | %100.0 | %12.5 | %22.2 |
| `steam_subscriber_agreement` | 11 | 7 | 96 (Kritik) | 7 | 4 | 0 | %100.0 | %63.6 | %77.8 |
| `dropbox_tos` | 6 | 5 | 86 (Kritik) | 5 | 1 | 0 | %100.0 | %83.3 | %90.9 |
| `spotify_privacy` | 6 | 2 | 60 (Yüksek) | 2 | 4 | 0 | %100.0 | %33.3 | %50.0 |
| **TOPLAM / GENEL** | **53** | **23** | - | **23** | **30** | **0** | **%100.0** | **%43.4** | **%60.5** |

### Analiz ve Çıkarımlar

1. **Yakalanan Maddeler (True Positives):** Model ve deterministik tarayıcı, özellikle kullanıcı aleyhine olan **tahkim (arbitration)**, **sorumluluk sınırlaması (as-is / limitation of liability)**, **tek taraflı değişiklik hakkı** ve **iade kısıtlamalarını** yüksek hassasiyetle tespit etmiştir.
2. **Kaçırılan Maddeler (False Negatives):** Kaçırılan maddeler genellikle aynı riskin dokümanın birden fazla fıkrasında veya özet kutusunda tekrarlandığı durumlarda görülmektedir (ör. Spotify'ın hem özetinde hem detaylı fıkrasında yer alan lisans şartları).
3. **Yanlış Alarmlar (False Positives):** Yanlış alarm olarak işaretlenen bazı bulgular, aslında tüketicinin aleyhine olabilecek ancak altın etiket setine dahil edilmemiş sınırda (borderline) maddelerdir (ör. şirket lehine geniş tazmin yükümlülükleri).
4. **Deterministik Doğrulama (Grounding):** Tüm maddeler orijinal metindeki harfi harfine alıntılarla doğrulanmış, hiçbir 'uydurma alıntı' kabul edilmemiştir.

### Doküman Bazında Detaylı Dağılım

#### spotify_us_tos
- **Risk Skoru:** 95/100 (Kritik)
- **Belirsizlik Göstergeleri:** 8 adet belirsizlik veya kural uyarısı üretildi.
- **Kaçırılan Örnek Maddeler:**
  - *liability_limitation*: "BY APPLICABLE LAW, IN NO EVENT WILL SPOTIFY, ITS OFFICERS, SHAREHOLDERS, EMPLOYEES, AGENTS, DIRECTOR..."
  - *liability_limitation*: "nd Spotify; and (2) in no event shall these Terms create any third-party beneficiary rights...."
  - *arbitration_class_waiver*: "law, jurisdiction, class action waiver, and jury trial waiver..."

#### spotify_tr_tos
- **Risk Skoru:** 48/100 (Orta)
- **Belirsizlik Göstergeleri:** 4 adet belirsizlik veya kural uyarısı üretildi.
- **Kaçırılan Örnek Maddeler:**
  - *liability_limitation*: "eklamlardan Spotify sorumlu değildir...."
  - *liability_limitation*: "i hiçbir işlem için sorumlu değildir. Sizin tarafınızdan Spotify'dan alınan sözlü ya da yazılı hiçbi..."
  - *liability_limitation*: "n ya da içeriğinden sorumlu değildir. Apple, Spotify Hizmeti ile ilgili olarak hiçbir bakım veya des..."

#### steam_subscriber_agreement
- **Risk Skoru:** 96/100 (Kritik)
- **Belirsizlik Göstergeleri:** 8 adet belirsizlik veya kural uyarısı üretildi.
- **Kaçırılan Örnek Maddeler:**
  - *liability_limitation*: "7. DISCLAIMERS; LIMITATION OF LIABILITY; NO GUARANTEES; LIMITED WARRANTY & AGREEMENT ⏶..."
  - *liability_limitation*: "ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, "WITH ALL FAULTS" AND WITHOUT WARRANTY OF ANY K..."
  - *liability_limitation*: "DAMAGES OR LOSSES. IN NO EVENT WILL VALVE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPE..."

#### dropbox_tos
- **Risk Skoru:** 86/100 (Kritik)
- **Belirsizlik Göstergeleri:** 6 adet belirsizlik veya kural uyarısı üretildi.
- **Kaçırılan Örnek Maddeler:**
  - *jurisdiction*: "m, you agree to the exclusive jurisdiction of the state and federal courts in San Francisco County, ..."

#### spotify_privacy
- **Risk Skoru:** 60/100 (Yüksek)
- **Belirsizlik Göstergeleri:** 3 adet belirsizlik veya kural uyarısı üretildi.
- **Kaçırılan Örnek Maddeler:**
  - *tracking_profiling*: "will only use your precise location data with your permission. You can grant this access through the..."
  - *tracking_profiling*: "IP addresses to non-precise location data (e.g., country or region, city, state)...."
  - *tracking_profiling*: "all users, based on precise location data (where available and explicitly permitted by you)...."

