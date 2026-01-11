
(() => {
  let lastTrackKey = null;
  let bpmContainer = null;

  const SELECTORS = {
    trackTitle: [
      'a[data-testid="context-item-link"]',
      'div[data-testid="now-playing-widget"] a[href*="/track/"]'
    ],
    artist: [
      'div[data-testid="now-playing-widget"] span a[href*="/artist/"]'
    ],
    playerBar: 'footer'
  };

  function findFirst(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function getTrackInfo() {
    const titleEl = findFirst(SELECTORS.trackTitle);
    const artistEl = findFirst(SELECTORS.artist);
    if (!titleEl || !artistEl) return null;
    return {
      title: titleEl.textContent.trim(),
      artist: artistEl.textContent.trim()
    };
  }

  function injectBPMUI() {
    if (bpmContainer) return bpmContainer;
    const playerBar = document.querySelector(SELECTORS.playerBar);
    if (!playerBar) return null;

    bpmContainer = document.createElement('div');
    bpmContainer.style.marginLeft = '12px';
    bpmContainer.style.fontSize = '12px';
    bpmContainer.style.color = '#b3b3b3';
    bpmContainer.innerHTML = `
      <span id="bpm-value">BPM: —</span>
      <a href="https://getsongbpm.com" target="_blank"
         style="margin-left:6px;color:#b3b3b3;text-decoration:none;">
        GetSongBPM
      </a>`;
    playerBar.appendChild(bpmContainer);
    return bpmContainer;
  }

  function updateBPMDisplay(bpm) {
    injectBPMUI();
    document.getElementById('bpm-value').textContent = bpm ? `BPM: ${bpm}` : 'BPM: N/A';
  }

  function handleTrackChange() {
    const info = getTrackInfo();
    if (!info) return;
    const trackKey = `${info.artist}|${info.title}`;
    if (trackKey === lastTrackKey) return;
    lastTrackKey = trackKey;
    updateBPMDisplay(null);
    chrome.runtime.sendMessage({ type: 'FETCH_BPM', track: info }, res => {
      updateBPMDisplay(res?.bpm || null);
    });
  }

  new MutationObserver(handleTrackChange)
    .observe(document.body, { childList: true, subtree: true });

  handleTrackChange();
})();
