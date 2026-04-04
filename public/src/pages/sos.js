/* ============================================
   SAFEPATH — SOS Page (Stub)
   ============================================
   Emergency SOS activation flow.
   Full implementation pending.
   ============================================ */

/**
 * Render the SOS page into the given container.
 * @param {HTMLElement} container — the #page-content element
 */
export function renderSOS(container) {
  const html = `
    <div class="page-view sos-page">
      <header class="page-stub-header slide-up">
        <h1 class="text-2xl font-extrabold">Emergency SOS</h1>
        <p class="text-secondary text-sm" style="margin-top: 8px;">
          Activate to broadcast your location to emergency contacts.
        </p>
      </header>

      <div class="glass glass-card slide-up" style="margin-top: 24px; text-align: center; animation-delay: 80ms;">
        <div style="font-size: 3rem; margin-bottom: 16px;">🚨</div>
        <p class="font-semibold text-lg">SOS Module</p>
        <p class="text-secondary text-sm" style="margin-top: 8px;">
          This page will contain the emergency activation flow,
          live location sharing, and contact notification system.
        </p>
      </div>
    </div>
  `;
  container.innerHTML = html;
}
