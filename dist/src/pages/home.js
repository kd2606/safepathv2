/* ============================================
   SAFEPATH — Home Page
   ============================================
   Layout:
   - Header (logo + avatar)
   - Safety status card
   - Quick stats row
   - Recent community reports
   ============================================ */

/**
 * Render the Home page into the given container.
 * @param {HTMLElement} container — the #page-content element
 */
export function renderHome(container) {
  const html = `
    <div class="page-view home-page">

      <!-- ═══════ HEADER ═══════ -->
      <header class="home-header slide-up" id="home-header">
        <div class="home-header__brand">
          <svg class="home-header__logo-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="13" stroke="url(#logoGrad)" stroke-width="2" fill="none"/>
            <path d="M14 6 L14 16 M14 16 L20 12" stroke="url(#logoGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 20 C8 20 11 23 14 23 C17 23 20 20 20 20" stroke="#00C853" stroke-width="2" stroke-linecap="round"/>
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28">
                <stop offset="0%" stop-color="#667eea"/>
                <stop offset="100%" stop-color="#764ba2"/>
              </linearGradient>
            </defs>
          </svg>
          <span class="home-header__logo-text">SafePath</span>
        </div>
        <button class="avatar" id="header-avatar" aria-label="User profile">
          K
        </button>
      </header>

      <!-- ═══════ SAFETY STATUS CARD ═══════ -->
      <section class="glass safety-status slide-up" id="safety-status-card" aria-label="Current safety status" style="animation-delay: 60ms">
        <div class="safety-status__indicator" aria-hidden="true">🛡️</div>
        <div class="safety-status__info">
          <p class="safety-status__label">Current Status</p>
          <p class="safety-status__text">You are in a <span class="status-safe">SAFE</span> zone 🟢</p>
        </div>
      </section>

      <!-- ═══════ QUICK STATS ═══════ -->
      <section class="stats-row slide-up stagger-children" id="quick-stats" aria-label="Quick statistics" style="animation-delay: 120ms">
        <div class="glass stat-card" id="stat-active-sos">
          <span class="stat-card__icon">🚨</span>
          <span class="stat-card__value status-danger">0</span>
          <span class="stat-card__label">Active SOS</span>
        </div>
        <div class="glass stat-card" id="stat-reports">
          <span class="stat-card__icon">📋</span>
          <span class="stat-card__value">12</span>
          <span class="stat-card__label">Reports Nearby</span>
        </div>
        <div class="glass stat-card" id="stat-routes">
          <span class="stat-card__icon">🛤️</span>
          <span class="stat-card__value status-safe">3</span>
          <span class="stat-card__label">Safe Routes</span>
        </div>
      </section>

      <!-- ═══════ RECENT REPORTS ═══════ -->
      <section class="slide-up" id="recent-reports-section" style="animation-delay: 180ms">
        <div class="section-header">
          <h2 class="section-header__title">Recent Reports</h2>
          <button class="section-header__action" id="view-all-reports">View All</button>
        </div>

        <div class="glass glass--sm" id="reports-list">
          <div class="report-item" id="report-1">
            <span class="report-item__severity report-item__severity--high" 
                  aria-label="High severity"></span>
            <div class="report-item__content">
              <p class="report-item__title">Suspicious activity reported</p>
              <p class="report-item__meta">MG Road · 12 min ago</p>
            </div>
            <span class="report-item__distance">0.3 km</span>
          </div>

          <div class="report-item" id="report-2">
            <span class="report-item__severity report-item__severity--medium" 
                  aria-label="Medium severity"></span>
            <div class="report-item__content">
              <p class="report-item__title">Poor street lighting</p>
              <p class="report-item__meta">Park Avenue · 1 hr ago</p>
            </div>
            <span class="report-item__distance">0.8 km</span>
          </div>

          <div class="report-item" id="report-3">
            <span class="report-item__severity report-item__severity--low" 
                  aria-label="Low severity"></span>
            <div class="report-item__content">
              <p class="report-item__title">Road construction ahead</p>
              <p class="report-item__meta">Station Rd · 3 hrs ago</p>
            </div>
            <span class="report-item__distance">1.2 km</span>
          </div>

          <div class="report-item" id="report-4">
            <span class="report-item__severity report-item__severity--high" 
                  aria-label="High severity"></span>
            <div class="report-item__content">
              <p class="report-item__title">Stray dog pack sighted</p>
              <p class="report-item__meta">Lake Garden · 4 hrs ago</p>
            </div>
            <span class="report-item__distance">1.5 km</span>
          </div>
        </div>
      </section>

    </div>
  `;

  container.innerHTML = html;
}
