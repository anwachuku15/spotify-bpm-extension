document.addEventListener('DOMContentLoaded', async () => {
  const input = document.getElementById('apiKey');
  const status = document.getElementById('status');
  const saveBtn = document.getElementById('save');

  const stored = await chrome.storage.local.get('GETSONGBPM_API_KEY');
  if (stored.GETSONGBPM_API_KEY) {
    input.value = stored.GETSONGBPM_API_KEY;
  }

  saveBtn.addEventListener('click', async () => {
    const key = input.value.trim();
    if (!key) {
      status.textContent = 'API key required';
      return;
    }

    await chrome.storage.local.set({ GETSONGBPM_API_KEY: key });
    status.textContent = 'API key saved';
  });
});
