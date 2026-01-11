
const API_KEY = 'REPLACE_WITH_YOUR_GETSONGBPM_API_KEY';
const API_URL = 'https://api.getsongbpm.com/search/';
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30;

function normalize(str) {
  return str.toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/-.*?(remaster|edit|version|live).*/g, '')
    .replace(/feat\.|ft\./g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function keyFor(a, t) {
  return `${normalize(a)}|${normalize(t)}`;
}

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type !== 'FETCH_BPM') return;

  (async () => {
    const { artist, title } = msg.track;
    const key = keyFor(artist, title);
    const stored = await chrome.storage.local.get(key);
    if (stored[key] && Date.now() - stored[key].ts < CACHE_TTL) {
      sendResponse({ bpm: stored[key].bpm });
      return;
    }

    const params = new URLSearchParams({
      api_key: API_KEY,
      type: 'track',
      lookup: 'song',
      artist,
      song_title: title
    });

    const res = await fetch(`${API_URL}?${params}`);
    const json = await res.json();
    const bpm = json?.search?.[0]?.tempo || null;

    if (bpm) {
      await chrome.storage.local.set({ [key]: { bpm, ts: Date.now() } });
    }
    sendResponse({ bpm });
  })();

  return true;
});
