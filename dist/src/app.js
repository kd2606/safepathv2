/* ============================================
   SAFEPATH — Main App Entry Point
   ============================================
   - Hash-based SPA router
   - Bottom navigation controller
   - SOS button handler
   - Page transitions with skeleton loading
   ============================================ */

import { renderHome } from './pages/home.js';
import { renderSOS }  from './pages/sos.js';
import { renderMap }  from './pages/map.js';
import { renderChat } from './pages/chat.js';
// Firebase init — imported for side effects (initializes the app)
// Uncomment when you add your Firebase config:
// import './firebase.js';


/* ── DOM References ── */
const pageContent = document.getElementById('page-content');
const sosButton   = document.getElementById('sos-button');
const bottomNav   = document.getElementById('bottom-nav');
const navTabs     = document.querySelectorAll('.nav-tab');


/* ── Route → Page Renderer Map ── */
const ROUTES = {
  home:    renderHome,
  map:     renderMap,
  chat:    renderChat,
  profile: renderProfileStub,  // Inline stub below
};


/* ── Profile Page Stub ── */
function renderProfileStub(container) {
  container.innerHTML = `
    <div class="page-view profile-page">
      <header class="page-stub-header slide-up">
        <h1 class="text-2xl font-extrabold">Profile</h1>
        <p class="text-secondary text-sm" style="margin-top: 8px;">
          Manage your account, emergency contacts & preferences.
        </p>
      </header>

      <div class="glass glass-card slide-up" style="margin-top: 24px; text-align: center; animation-delay: 80ms;">
        <div class="avatar avatar--lg" style="margin: 0 auto 16px;">K</div>
        <p class="font-semibold text-lg">Krrish</p>
        <p class="text-secondary text-sm" style="margin-top: 4px;">krrish@example.com</p>
      </div>

      <div class="glass glass-card slide-up" style="margin-top: 16px; animation-delay: 160ms;">
        <p class="font-semibold text-sm" style="margin-bottom: 12px;">Quick Settings</p>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button class="glass-btn" id="btn-emergency-contacts">📞  Emergency Contacts</button>
          <button class="glass-btn" id="btn-notifications">🔔  Notifications</button>
          <button class="glass-btn glass-btn--danger" id="btn-sign-out">🚪  Sign Out</button>
        </div>
      </div>
    </div>
  `;
}


/* ── Router ── */

/**
 * Navigate to a page by name.
 * Shows a skeleton loader briefly, then renders the page
 * with a fade+slide animation.
 * 
 * @param {string} page — one of 'home', 'map', 'chat', 'profile'
 */
function navigateTo(page) {
  const renderer = ROUTES[page];
  if (!renderer) {
    console.warn(`[Router] Unknown page: "${page}"`);
    navigateTo('home');
    return;
  }

  // Update active nav tab
  navTabs.forEach(tab => {
    const isActive = tab.dataset.page === page;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  // Show skeleton briefly for realistic loading feel
  showSkeleton();

  // Small delay to show skeleton, then render page
  setTimeout(() => {
    hideSkeleton();
    renderer(pageContent);
  }, 300);
}


/**
 * Parse the current hash and navigate to the corresponding page.
 */
function handleRoute() {
  const hash = window.location.hash.slice(1) || 'home';
  navigateTo(hash);
}


/* ── Skeleton Helpers ── */

function showSkeleton() {
  pageContent.innerHTML = `
    <div id="skeleton-loader" class="skeleton-screen">
      <div class="skeleton-header">
        <div class="skeleton-bar skeleton-logo"></div>
        <div class="skeleton-circle skeleton-avatar"></div>
      </div>
      <div class="skeleton-card skeleton-card-lg"></div>
      <div class="skeleton-row">
        <div class="skeleton-card skeleton-card-sm"></div>
        <div class="skeleton-card skeleton-card-sm"></div>
        <div class="skeleton-card skeleton-card-sm"></div>
      </div>
      <div class="skeleton-card skeleton-card-md"></div>
      <div class="skeleton-card skeleton-card-md"></div>
    </div>
  `;
}

function hideSkeleton() {
  const skeleton = document.getElementById('skeleton-loader');
  if (skeleton) skeleton.remove();
}


/* ── SOS Button Handler ── */
sosButton.addEventListener('click', () => {
  // Haptic feedback (if supported)
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 200]);
  }

  // Navigate to SOS page (or trigger SOS flow directly later)
  window.location.hash = '#sos';
  // Future: open SOS confirmation modal instead
  console.log('[SOS] Emergency button pressed');
});

// Add keyboard accessibility
sosButton.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    sosButton.click();
  }
});


/* ── Navigation Click Handler ── */
bottomNav.addEventListener('click', (e) => {
  const tab = e.target.closest('.nav-tab');
  if (!tab) return;

  e.preventDefault();
  const page = tab.dataset.page;
  if (page) {
    window.location.hash = `#${page}`;
  }
});


/* ── Initialize ── */
window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', () => {
  // Hide initial skeleton and load the correct page
  handleRoute();

  console.log(
    '%c🛡️ SafePath loaded',
    'color: #00C853; font-size: 14px; font-weight: bold;'
  );
});
