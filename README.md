# ClauseRadar 🛡️
### Web Sözleşmeleri, Gizlilik Politikaları ve Abonelik Şartları Akıllı Risk Analizörü

Web sitelerinin Kullanım Koşulları (Terms of Service), Gizlilik Politikaları (Privacy Policy) ve Abonelik Şartları çoğu zaman onlarca sayfalık karmaşık hukuk diliyle yazılır ve kullanıcılar okumadan "Kabul Ediyorum" butonuna basmak zorunda kalır.

**ClauseRadar**, bir siteye girdiğiniz anda sözleşme metinlerini otomatik olarak tespit edip okuyan; tüketici aleyhine olabilecek riskli maddeleri **birebir alıntılarla** doğrulayıp sade Türkçe ile özetleyen ve görme engelli kullanıcılar için sesli geri bildirim sağlayan yeni nesil bir Chrome uzantısıdır (Manifest V3, Yan Panel).

> ⚖️ **HUKUKİ TAVSİYE DEĞİLDİR:** Bu uygulama ve üretilen raporlar **hukuki tavsiye (legal advice) niteliği taşımaz**. Yalnızca kullanıcı farkındalığını artırma amaçlı otomatik bir ön okuma ve karar destek aracıdır. Bu uyarı panelin altında her zaman sabit olarak gösterilir.

---

## 📌 Temel Tasarım İlkeleri

1. **Strict Verbatim Grounding (Doğrulanmış Birebir Alıntı):** Her riskli madde, orijinal metinden harfi harfine alıntıyla (`verbatim quote`) eşleştirilir. Alıntısı metinde bulunamayan veya model tarafından uydurulan hiçbir iddia geçerli sayılmaz; elenen iddialar panelde şeffafça gerekçesiyle listelenir.
2. **Deterministik Kod Tabanlı Skorlama:** Risk puanı ve risk seviyesi yapay zekânın tahminine bırakılmaz; doğrulanmış maddelerin önem ağırlıkları üzerinden kod tarafından deterministik matematiksel formüllerle (0-100) hesaplanır.
3. **Şeffaf ve Dürüst Belirsizlik (Honest Uncertainty):** Sistem tam okuyamadığı, alıntısı şüpheli veya kural tabanlı sistemle çelişen durumlarda kesin hüküm vermez; "Emin olamadım" diyerek şüphelerini ve nedenlerini kullanıcıya açıkça sunar.
4. **Çok Katmanlı Güvenlik & Prompt Injection Kalkanı:** Web sitelerine gizlenmiş kötü niyetli komutlara (`display:none`, şüpheli talimat kalıpları) karşı DOM filtreleme, komut sansürleme ve kural tabanlı emniyet ağıyla tam koruma sağlar.
5. **Evrensel Erişilebilirlik (Audio & Screen Reader):** WebAudio API ile sentezlenen ses imzaları (güvenli onay notaları, risk uyarı tonu) ve `chrome.tts` sesli okuma desteğiyle görme engelli bireyler için tam erişilebilirlik sunar.
6. **Gizlilik Önceliği:** API anahtarları asla web sayfasına sızdırılmaz; tüm işlemler arka plan servis çalışanı (`background.js`) üzerinden güvenle yürütülür.

---

## 🏛️ Mimari Yapı ve Veri Akışı

```mermaid
flowchart LR
  A[Aktif Web Sayfası] -->|chrome.scripting| B[extract.js<br/>Görünür metin çıkarılır, gizli metin elenir]
  B --> C[segment.js<br/>Numaralı segmentler]
  C --> D[guard.js<br/>Talimat kalıplarını sansürle]
  D --> E[background.js<br/>LLM API Çağrısı]
  E --> F[schema.js validate<br/>Şema + Birebir Alıntı Doğrulama]
  C --> G[rules.js<br/>Kural Tabanlı Güvenlik Ağı]
  F --> H[pipeline.js<br/>Deterministik Skor ve Karar Motoru]
  G --> H
  H --> I[panel.js<br/>Arayüz, Ses İmzası, Ekran Okuyucu]
```

### Modüller ve Görev Dağılımı

| Modül | Görev |
|---|---|
| `src/extract.js` | Sayfa metnini çıkarır. `display:none`, `opacity:0`, `font-size:0`, ekran dışı ve arka planla aynı renkteki gizli metinleri **ayııklar** ve sayar. |
| `src/segment.js` | Metni numaralı segmentlere böler (≤900 karakter), partilere ayırır ve bellek taşmalarına karşı sınırlar. |
| `src/guard.js` | Türkçe ve İngilizce talimat kalıplarını (prompt injection) tespit eder ve modele gitmeden sansürler. |
| `src/llm.js` | Sistem istemi, yapılandırılmış JSON şema istek gövdesi ve API taşıma katmanı. |
| `src/schema.js` | Kategoriler, JSON şeması, **deterministik alıntı doğrulama** (`validate`) ve skorlama. |
| `src/rules.js` | LLM'in atladığı belirgin maddeleri geri ekleyen kural ağı; LLM'siz taban çizgisi. |
| `src/pipeline.js` | Analiz akışını yönetir, nihai karar ve güvensizlik nedenlerini üretir. |
| `src/audio.js`, `offscreen.html` | WebAudio API ile sentezlenen ses imzaları (onay/uyarı tonları) ve `chrome.tts` sesli okuma. |
| `src/links.js` | Sayfadaki ToS, Gizlilik, KVKK ve Abonelik bağlantılarını otomatik tarayan motor. |
| `src/agent-entry.js` | Sitede bağlantı bulunamadığında devreye giren otonom gezinme ajanı. |
| `background.js` | Otomatik tarama, arka plan sekme okuma, rozet yönetimi ve servis çalışanı. |
| `panel.html` & `panel.css` | Yan panel arayüzü, erişilebilir bileşenler ve sabit yasal uyarı. |

---

## 🤖 Otonom Sayfa Ajanı (Akıllı Gezinme)

Otomatik bağlantı tarayıcısı sayfada doğrudan bir sözleşme linki bulamazsa yan panelde **"Şartları yapay zekâyla ara"** butonu belirir:

* Bu düğme sayfa üzerinde otonom gezinme ajanını başlatır.
* Ajan DOM ağacını okur ve verilen hedefi gerçekleştirir: *Kullanım Koşulları / Gizlilik / Abonelik bağlantısını bul ve aç.*
* **Güvenlik Sınırlandırması:** Form doldurma, satın alma ve "kabul et" butonlarına tıklama yetkileri kesin olarak kısıtlanmıştır (`maxSteps: 8`). Ajan yalnızca sözleşme sayfasına ulaşmak için gezinir.

---

## 🚀 Sıfır Ayar Kullanım Deneyimi

Kullanıcı uzantıyı yükledikten sonra hiçbir karmaşık ayarla uğraşmaz:

1. **Kendiliğinden Tarama:** Bir siteye girdiğinizde uzantı sayfayı inceler; metin bir sözleşmeyse doğrudan okur, değilse footer ve menülerdeki yasal bağlantıları arka planda bulup analiz eder.
2. **Sesli Duyuru:** Sonuç **kendiliğinden sesle bildirilir** (ses imzası + nedenler). Paneli açmak zorunlu değildir.
3. **Durum Rozeti:** Tarayıcı araç çubuğundaki simgede anlık durum rozeti görünür: `✓` (güvenli), `!` (dikkat), `!!` (yüksek risk), `?` (emin değilim).
4. **Yan Panel ve Kısayollar:**
   * `Alt+Shift+I`: ClauseRadar yan panelini açar.
   * `Alt+Shift+K`: Sonucu sesli olarak tekrar okur.

---

## 🔊 Ses ve Erişilebilirlik

| Analiz Sonucu | WebAudio Ses İmzası | Sesli Okuma (TTS) |
|---|---|---|
| **Belirgin risk yok** | Yükselen iki yumuşak nota (onay) | "Belirgin risk bulunmadı…" |
| **Dikkat** | İki kısa orta perdeli ton | Tespit edilen maddeler ve önem dereceleri |
| **Yüksek risk** | Alçalan üç nota (durun) | En kritik 3 maddenin adı ve sade Türkçe açıklaması |
| **Emin değilim** | Yarım kalan soru tonu | İlk güvensizlik nedeni |

- **Ekran Okuyucu Desteği:** Tüm sonuçlar `aria-live` bölgesine yazılır; grafikler `aria-label` ile seslendirilir.
- **Tek Tuşla Kontrol:** Paneldeki "Ses: açık/kapalı" düğmesiyle sesler tek tıkla kapatılabilir.

---

## 🛡️ Çok Katmanlı Prompt Injection Savunması

Sistem, sayfalara gizlenmiş manipülatif talimatlara karşı çok katmanlı savunma uygular (`test/injection.test.js` ile test edilmiştir):

| Savunma Katmanı | Nasıl Çalışır? |
|---|---|
| **DOM Katmanı** | `display:none`, `opacity:0`, `font-size:0`, aynı renk arka plan gibi gizli metinler modele hiç gitmeden elenir. |
| **Sansür Katmanı** | Görünür talimat kalıpları (`ignore instructions`, `tüm talimatları unut`, `risk 0 de`) `[ŞÜPHELİ_TALİMAT_ÇIKARILDI]` ile maskelenir. |
| **Yetki Ayrımı** | Model skor ve karar üretemez; modele yalnızca bulgu listeleme görevi verilir. |
| **Deterministik Doğrulama** | Modelin uydurduğu (metinde harfi harfine bulunmayan) bulgular atılır. |
| **Kural Güvenlik Ağı** | Model manipüle edilip "bulgu yok" dese dahi, kural motoru belirgin riskleri yakalar. |
| **Dürüst Belirsizlik** | Sayfada saldırı tespit edildiyse sistem asla "güvenli" demez; şüpheli durumu kullanıcıya bildirir. |

---

## 📊 Mini Eval (Değerlendirme)

```bash
npm run eval
```

Smoke test seti (`eval/smoke/defterim.txt`) üzerinde yapılan değerlendirme:

| Belge | Etiketli Madde | Yakalanan | Kaçırılan | Yanlış Alarm | Karar | Skor |
|---|---|---|---|---|---|---|
| `defterim` | 6 | 5 | 1 | 0 | Yüksek Risk | 77/100 |

* **Yakalama Oranı (Recall):** %83
* **Kesinlik (Precision):** %100 (Sıfır yanlış alarm)

---

## 🎥 Cypress E2E Demo Videosu (≤ 90 sn)

Cypress ile kaydedilmiş demo videosu projenin içindedir:
* **Video Dosyası:** [cypress/videos/demo.cy.js.mp4](file:///c:/Users/ERDEM/Desktop/antigravity_odev/cypress/videos/demo.cy.js.mp4)
* **Kapsanan Senaryolar:**
  1. **Mutlu Yol (Happy Path):** Riskli maddelerin birebir sözleşme alıntılarıyla yakalanıp doğrulanması.
  2. **Prompt Injection Savunması:** Sayfadaki gizli talimata rağmen kural ağının riskleri yakalaması ve saldırıyı raporlaması.
  3. **Dürüst Belirsizlik (Honest Uncertainty):** Uydurma alıntının elenmesi ve sistemin şeffafça "Emin olamadım" diyerek şüphelerini listelemesi.

---

## 💻 Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleme ve Derleme
```bash
npm install
npm run build
```

### 2. Testleri Çalıştırma
```bash
# 18 adet birim test (doğrulama, injection savunması, bağlantı arama)
npm test

# Mini eval çalıştırma
npm run eval
```

### 3. Cypress Testini ve Demo Videosunu Çalıştırma
```bash
# Sunucuyu ve Cypress'i başlatıp videoyu kaydeder:
node run-cypress.mjs
```

### 4. Chrome Uzantısını Yükleme
1. Google Chrome'da `chrome://extensions` adresine gidin.
2. Sağ üstten **Geliştirici modu**nu (Developer mode) açın.
3. **Paketlenmemiş öğe yükle** (Load unpacked) butonuna basarak bu proje klasörünü seçin.
4. Herhangi bir web sitesine girin; **ClauseRadar** yan panelde ve arka planda otomatik olarak korumaya başlayacaktır!
