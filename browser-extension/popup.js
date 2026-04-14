// ScreenSnap Browser Extension — Popup Script

const APP_URL = 'http://localhost:3000'; // Production'da: 'https://your-screensnap-domain.com'

const MEETING_PLATFORMS = [
  { match: 'meet.google.com', name: 'Google Meet', icon: 'G' },
  { match: 'teams.microsoft.com', name: 'Microsoft Teams', icon: 'T' },
  { match: 'zoom.us', name: 'Zoom', icon: 'Z' },
  { match: 'webex.com', name: 'Cisco Webex', icon: 'W' },
];

let recordingInterval = null;
let secondsElapsed = 0;

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

async function detectMeeting() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tabs[0]?.url || '';
    return MEETING_PLATFORMS.find(p => url.includes(p.match)) || null;
  } catch { return null; }
}

async function isRecording() {
  const { screensnap_recording } = await chrome.storage.local.get('screensnap_recording');
  return screensnap_recording || false;
}

async function init() {
  const meeting = await detectMeeting();
  const recording = await isRecording();

  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const meetingBadge = document.getElementById('meetingBadge');
  const meetingPlatform = document.getElementById('meetingPlatform');
  const recordBtn = document.getElementById('recordBtn');
  const recordLabel = document.getElementById('recordLabel');
  const timer = document.getElementById('timer');

  if (meeting) {
    statusDot.className = 'status-dot meeting';
    statusText.textContent = 'Meeting sayfasinda — kayit onerilir';
    meetingBadge.classList.add('visible');
    meetingPlatform.textContent = meeting.name;
  }

  if (recording) {
    statusDot.className = 'status-dot active';
    statusText.textContent = 'Kayit devam ediyor...';
    recordBtn.className = 'btn btn-red';
    recordLabel.textContent = 'Kaydi Durdur';
    timer.classList.add('visible');
    const { screensnap_start_time } = await chrome.storage.local.get('screensnap_start_time');
    if (screensnap_start_time) {
      secondsElapsed = Math.floor((Date.now() - screensnap_start_time) / 1000);
    }
    timer.textContent = formatTime(secondsElapsed);
    recordingInterval = setInterval(() => {
      secondsElapsed++;
      timer.textContent = formatTime(secondsElapsed);
    }, 1000);
  }

  // Record button
  recordBtn.addEventListener('click', async () => {
    const rec = await isRecording();
    if (rec) {
      // Stop recording
      await chrome.storage.local.set({ screensnap_recording: false });
      clearInterval(recordingInterval);
      // Open app to see saved recording
      chrome.tabs.create({ url: APP_URL });
      window.close();
    } else {
      // Open app and start recording
      await chrome.storage.local.set({ screensnap_recording: true, screensnap_start_time: Date.now() });
      const tab = await chrome.tabs.create({ url: `${APP_URL}?action=record` });
      window.close();
    }
  });

  // Open app button
  document.getElementById('openAppBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: APP_URL });
    window.close();
  });

  // Settings button
  document.getElementById('openSettingsBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: `${APP_URL}/settings` });
    window.close();
  });

  // Display app URL
  document.getElementById('appUrl').textContent = APP_URL;
  document.getElementById('appUrl').addEventListener('click', () => {
    chrome.tabs.create({ url: APP_URL });
    window.close();
  });
}

document.addEventListener('DOMContentLoaded', init);
