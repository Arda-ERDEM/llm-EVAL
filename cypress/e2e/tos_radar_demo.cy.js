describe('ToS Risk Radar - 1080p Full HD E2E Demo (1 Dakika)', () => {
  before(() => {
    // Hide any Cypress runner chrome if present, ensuring 100% full screen for AUT
    const topDoc = window.top.document;
    if (topDoc) {
      const style = topDoc.createElement('style');
      style.id = 'hide-cypress-runner';
      style.innerHTML = `
        .reporter-wrap, .runner-header, .header-pane, .sidebar, .split-pane-pane:first-child {
          display: none !important;
          width: 0 !important;
          flex: 0 !important;
        }
        .container, .wrap, .aut-iframe, .split-pane-pane:last-child {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      `;
      topDoc.head.appendChild(style);
    }
  });

  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.visit('/demo/index.html');
    cy.window().then((win) => {
      try {
        const top = win.top;
        if (top && top.document) {
          const doc = top.document;
          const styleId = 'hide-cypress-reporter-style';
          if (!doc.getElementById(styleId)) {
            const style = doc.createElement('style');
            style.id = styleId;
            style.innerHTML = `
              [data-cy="reporter"],
              .reporter-wrap,
              .reporter,
              aside[aria-label="Runner Navigation"],
              .runner.container aside,
              .split-pane-pane:first-child,
              div[class*="reporter"] {
                display: none !important;
                width: 0 !important;
                flex: 0 0 0 !important;
                opacity: 0 !important;
                pointer-events: none !important;
                visibility: hidden !important;
              }
              .riframe,
              .iframes-container,
              .runner.container,
              .aut-iframe,
              .split-pane-pane:last-child {
                width: 100vw !important;
                height: 100vh !important;
                left: 0 !important;
                top: 0 !important;
                position: fixed !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            `;
            doc.head.appendChild(style);
          }
        }
      } catch (e) {
        // cross-origin ignore
      }
    });
  });

  it('ToS Metni Analizi, Alıntı Doğrulama & Belirsizlik/Güvenlik Testi', () => {
    const setGuide = (text) => {
      cy.get('#demo-guide-text').invoke('text', text);
    };

    // =========================================================================
    // 1. AŞAMA: SÖZLEŞME VE RİSKLİ MADDENİN İNCELENMESİ (0s - 13s)
    // =========================================================================
    setGuide('1. Adım: Streamify Abonelik Sözleşmesi ve Riskli Cümle İnceleniyor...');
    cy.get('.disclaimer-banner').should('be.visible');
    cy.wait(2500);

    // Sözleşmeyi aşağı kaydırarak 1. maddedeki riskli cümleye odaklan
    // "Şirketimiz bu sözleşmeyi ve sunulan hizmetlerin kapsamını önceden bildirimde bulunmaksızın tek taraflı olarak değiştirme hakkını saklı tutar."
    cy.get('#clause-unilateral').scrollIntoView({ duration: 2500 }).should('be.visible');
    cy.wait(3500);

    // İade kısıtlaması maddesini de göster
    cy.get('#clause-refund').scrollIntoView({ duration: 2000 }).should('be.visible');
    cy.wait(2500);

    // Belgenin başına geri dön
    cy.get('#document-body h1').scrollIntoView({ duration: 1500 });
    cy.wait(1000);

    // =========================================================================
    // 2. AŞAMA: ANALİZİN BAŞLATILMASI VE RİSK SKORU (13s - 25s)
    // =========================================================================
    setGuide("2. Adım: 'Sayfayı Analiz Et' Butonu ile ToS Risk Radar Çalıştırılıyor...");
    cy.get('#btn-analyze').click();
    cy.get('#btn-spinner').should('be.visible');
    cy.wait(2500);

    setGuide('3. Adım: Analiz Tamamlandı - 0-100 Deterministik Risk Skoru ve Sade Türkçe Özet.');
    cy.get('#results-container').should('be.visible');
    cy.get('#score-number').invoke('text').then((score) => {
      const num = parseInt(score, 10);
      expect(num).to.be.greaterThan(60);
    });
    cy.wait(4000);

    // =========================================================================
    // 3. AŞAMA: TESPİT EDİLEN RİSKLİ MADDELER (25s - 36s)
    // =========================================================================
    setGuide('4. Adım: Tespit Edilen Riskli Maddeler ve Gerekçeleri İnceleniyor...');
    cy.get('#summary-text').scrollIntoView({ duration: 1200 }).should('be.visible');
    cy.wait(3000);

    cy.get('.finding-item').first().scrollIntoView({ duration: 1200 }).should('be.visible');
    cy.get('.finding-item').should('have.length.at.least', 3);
    cy.wait(4500);

    // =========================================================================
    // 4. AŞAMA: ALINTI DOĞRULAMA VE METİNDE VURGULAMA (36s - 48s)
    // =========================================================================
    setGuide("5. Adım: 'Sayfada Vurgula' Tıklanarak Alıntı Metin Üzerinde Doğrulanıyor...");
    cy.wait(1500);

    // İlk riskli maddenin 'Sayfada Vurgula' butonuna tıkla
    cy.contains('.btn-show-in-page', 'Sayfada Vurgula').first().click();

    // Metindeki ilgili cümlenin sarı/kırmızıyla çerçevelendiğini ve rozet çıktığını doğrula
    cy.get('.clause-highlighted').should('be.visible');
    cy.screenshot('demo_1080p_snapshot');
    cy.wait(6500); // İzleyici metindeki alıntıyı ve analizi net bir şekilde okusun

    // =========================================================================
    // 5. AŞAMA: 2. SENARYO - GİZLİ PROMPT INJECTION VE DÜRÜST BELİRSİZLİK (48s - 58s)
    // =========================================================================
    setGuide('6. Adım: 2. Senaryo - Gizli Saldırı (Prompt Injection) & Belirsizlik Testi...');
    cy.get('#btn-scenario-uncertain').click();
    cy.get('#document-body h1').scrollIntoView({ duration: 1000 });

    // Saldırı kalıbını göster
    cy.get('.injected-box').should('contain', 'IGNORE PREVIOUS INSTRUCTIONS');
    cy.wait(3000);

    setGuide('7. Adım: Sistem Manipülasyonu Reddetti & Belirsizlikleri Şeffafça Gösterdi.');
    cy.get('#btn-analyze').click();
    cy.wait(2000);

    cy.get('#results-container').should('be.visible');
    cy.get('#uncertainty-section').scrollIntoView({ duration: 1200 }).should('be.visible');
    cy.get('#uncertainty-list').invoke('text').should('match', /DİKKAT|Belirsizlik|Güvenlik/);
    cy.wait(4000);

    // =========================================================================
    // 6. AŞAMA: TAMAMLANMA VE KANIT (58s - 61s)
    // =========================================================================
    setGuide('Demo Başarıyla Tamamlandı: %100 Alıntı Doğrulama & Güvenlik Kanıtlandı.');
    cy.wait(3000);
  });
});
