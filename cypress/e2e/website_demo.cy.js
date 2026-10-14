// ClauseRadar Gerçekçi Web Sitesi Üzerinde Eklenti Demosu
// 1080p Full HD, ~66 saniye, Ses ile tam senkron

describe('ClauseRadar Chrome Eklentisi Web Sitesi Demosu', () => {
  it('Streamify sitesinde sözleşmeyi tarar, riskleri bulur, saldırıyı engeller ve sesli uyarır', () => {
    // 0.0s - 8.0s: Giriş - Web sitesi ve eklenti paneli açılır
    cy.visit('/fixtures/browser_demo.html');
    cy.get('.doc-title').should('be.visible');
    cy.get('#sidepanel').should('be.visible');
    cy.wait(8000);

    // 8.0s - 15.0s: Sözleşme gezintisi ve tarama
    cy.get('#website-pane').scrollTo('top');
    cy.wait(1500);
    cy.get('#section-unilateral').scrollIntoView({ duration: 2500 });
    cy.get('#btn-rescan').click();
    cy.get('#scan-status').should('contain', 'Tarama tamamlandı');
    cy.wait(3000);

    // 15.0s - 22.0s: Yüksek Risk Kararı ve 84/100 Göstergesi
    cy.get('#verdict-card').scrollIntoView({ duration: 800 });
    cy.get('#verdict-card').should('contain', 'Yüksek riskli maddeler var');
    cy.get('#score-val').should('contain', '84');
    cy.get('#track-marker').should('be.visible');
    cy.wait(6200);

    // 22.0s - 33.0s: Doğrulanan Maddeler ve Birebir Alıntılar
    cy.get('#finding-1').scrollIntoView({ duration: 1500 });
    cy.get('#finding-1 .finding-quote').should('contain', 'tek taraflı olarak değiştirme hakkını saklı tutar');
    cy.wait(3500);
    cy.get('#finding-2').scrollIntoView({ duration: 1500 });
    cy.get('#finding-2 .finding-quote').should('contain', 'toplu dava');
    cy.wait(4500);

    // 33.0s - 41.0s: "Sayfada Göster" ile Çift Yönlü Doğrulama
    cy.get('#finding-1 .btn-highlight').click();
    cy.get('#clause-unilateral').should('have.class', 'clause-highlight');
    cy.wait(4000);
    cy.get('#finding-2 .btn-highlight').click();
    cy.get('#clause-arbitration').should('have.class', 'clause-highlight');
    cy.wait(4000);

    // 41.0s - 49.0s: Prompt Injection Saldırısının Engellenmesi
    cy.get('#details-injection').scrollIntoView({ duration: 1000 });
    cy.get('#details-injection summary').click();
    cy.get('#details-injection').should('have.attr', 'open');
    cy.get('#details-injection code').should('contain', 'SİSTEM TALİMATI');
    cy.wait(7000);

    // 49.0s - 56.5s: Halüsinasyon / Temelsiz İddiaların Elenmesi
    cy.get('#details-rejected').scrollIntoView({ duration: 1000 });
    cy.get('#details-rejected summary').click();
    cy.get('#details-rejected').should('have.attr', 'open');
    cy.get('#details-rejected code').should('contain', 'kamera ve mikrofonunu');
    cy.wait(6500);

    // 56.5s - 66.5s: Hukuki Tavsiye Değildir Uyarısı ve Kapanış
    cy.get('.pinned-footer').scrollIntoView({ duration: 1000 });
    cy.get('.pinned-footer').should('contain', 'Hukuki tavsiye değildir');
    cy.wait(9000);
  });
});
