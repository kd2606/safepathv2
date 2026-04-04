/* ============================================
   SAFEPATH — AI Chat Page (Stub)
   ============================================
   Gemini 1.5 Flash powered safety assistant.
   Full implementation pending.
   ============================================ */

/**
 * Render the AI Chat page into the given container.
 * @param {HTMLElement} container — the #page-content element
 */
export function renderChat(container) {
  const html = `
    <div class="page-view chat-page">
      <header class="page-stub-header slide-up">
        <h1 class="text-2xl font-extrabold">AI Safety Assistant</h1>
        <p class="text-secondary text-sm" style="margin-top: 8px;">
          Powered by Gemini 1.5 Flash — ask about safety tips, routes & more.
        </p>
      </header>

      <div class="glass glass-card slide-up" style="margin-top: 24px; animation-delay: 80ms;">
        <!-- Sample AI chat bubble -->
        <div class="glass-bubble glass-bubble--ai" style="margin-bottom: 16px;">
          <p class="text-sm">👋 Hi! I'm your SafePath AI assistant. I can help you with safety tips, route analysis, and emergency guidance. How can I help?</p>
        </div>

        <div class="glass-bubble glass-bubble--user" style="margin-bottom: 24px;">
          <p class="text-sm">Is the MG Road area safe right now?</p>
        </div>

        <p class="text-tertiary text-sm" style="text-align: center;">
          Full chat interface coming soon.
        </p>
      </div>

      <!-- Sample chat input -->
      <div class="slide-up" style="margin-top: 16px; animation-delay: 160ms;">
        <input 
          type="text" 
          class="glass-input" 
          id="chat-input"
          placeholder="Ask about safety in your area…"
          aria-label="Chat message input"
          disabled
        />
      </div>
    </div>
  `;
  container.innerHTML = html;
}
