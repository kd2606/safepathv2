/* ============================================
   SAFEPATH — Map Page (Stub)
   ============================================
   Google Maps integration with danger heatmap.
   Full implementation pending.
   ============================================ */

/**
 * Render the Map page into the given container.
 * @param {HTMLElement} container — the #page-content element
 */
export function renderMap(container) {
  const html = `
    <div class="page-view map-page">
      <header class="page-stub-header slide-up">
        <h1 class="text-2xl font-extrabold">Safety Map</h1>
        <p class="text-secondary text-sm" style="margin-top: 8px;">
          View danger zones, safe routes, and community reports.
        </p>
      </header>

      <div class="glass glass-card slide-up" style="margin-top: 24px; text-align: center; animation-delay: 80ms;">
        <div style="font-size: 3rem; margin-bottom: 16px;">🗺️</div>
        <p class="font-semibold text-lg">Map Module</p>
        <p class="text-secondary text-sm" style="margin-top: 8px;">
          This page will render Google Maps with danger heatmaps,
          safe route overlays, and real-time report markers.
        </p>
      </div>
    </div>
  `;
  container.innerHTML = html;
}
