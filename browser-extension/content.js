// ScreenSnap Extension — Content Script
// Injected into Google Meet, Teams, Zoom, Webex pages

const MEETING_CONFIG = {
  'meet.google.com': { name: 'Google Meet', color: '#4285f4', selector: '[data-call-ended]' },
  'teams.microsoft.com': { name: 'Microsoft Teams', color: '#5059c9', selector: '.ts-calling-screen' },
  'zoom.us': { name: 'Zoom', color: '#2d8cff', selector: '.meeting-app' },
};

function detectCurrentPlatform() {
  const host = location.hostname;
  return Object.entries(MEETING_CONFIG).find(([domain]) => host.includes(domain));
}

function injectRecordButton() {
  if (document.getElementById('screensnap-record-btn')) return;

  const [domain, config] = detectCurrentPlatform() || [];
  if (!config) return;

  const btn = document.createElement('button');
  btn.id = 'screensnap-record-btn';
  btn.title = 'ScreenSnap ile Kaydet';
  btn.innerHTML = `
    <div style="
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      border: none;
      border-radius: 50px;
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(124,58,237,0.4);
      transition: all 0.2s;
    ">
      <span style="width:10px;height:10px;border-radius:50%;background:#ff4444;animation:pulse 1s infinite;display:inline-block;"></span>
      ScreenSnap ile Kaydet
    </div>
    <style>
      @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
      #screensnap-record-btn:hover div { transform: translateY(-2px); box-shadow: 0 6px 25px rgba(124,58,237,0.5); }
    </style>
  `;

  btn.style.cssText = 'position:fixed;bottom:0;right:0;z-index:9999;background:none;border:none;cursor:pointer;';
  btn.addEventListener('click', () => {
    const appUrl = 'http://localhost:3000/?action=record&source=' + encodeURIComponent(config.name);
    window.open(appUrl, '_blank', 'width=1280,height=800');
  });

  document.body.appendChild(btn);
}

// Wait for meeting page to load fully
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(injectRecordButton, 2000));
} else {
  setTimeout(injectRecordButton, 2000);
}

// Re-inject on navigation (SPA)
const observer = new MutationObserver(() => {
  if (!document.getElementById('screensnap-record-btn')) {
    setTimeout(injectRecordButton, 1000);
  }
});
observer.observe(document.body, { childList: true, subtree: true });
