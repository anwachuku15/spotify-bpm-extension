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

function keyFor(artist, title) {
  return `${normalize(artist)}|${normalize(title)}`;
}

async function getApiKey() {
  const data = await chrome.storage.local.get('GETSONGBPM_API_KEY');
  return data.GETSONGBPM_API_KEY || null;
}

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type !== 'FETCH_BPM') return;

  (async () => {
    const apiKey = await getApiKey();
    if (!apiKey) {
      sendResponse({ bpm: null });
      return;
    }

    const { artist, title } = msg.track;
    const key = keyFor(artist, title);

    const cached = await chrome.storage.local.get(key);
    if (cached[key] && Date.now() - cached[key].ts < CACHE_TTL) {
      sendResponse({ bpm: cached[key].bpm });
      return;
    }

    const params = new URLSearchParams({
      api_key: apiKey,
      type: 'track',
      lookup: 'song',
      artist,
      song_title: title
    });

    try {
      const res = await fetch(`${API_URL}?${params}`);
      if (!res.ok) throw new Error('API error');

      const json = await res.json();
      const bpm = json?.search?.[0]?.tempo || null;

      if (bpm) {
        await chrome.storage.local.set({
          [key]: { bpm, ts: Date.now() }
        });
      }

      sendResponse({ bpm });
    } catch {
      sendResponse({ bpm: null });
    }
  })();

  return true;
});
