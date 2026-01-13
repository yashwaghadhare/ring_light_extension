const controls = ["brightness", "tone", "width"];

const toggleEl = document.getElementById("toggle");
const toggleText = toggleEl.querySelector("span");
const resetBtn = document.getElementById("reset");

async function getTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id || tab.url.startsWith("chrome")) return null;
  return tab;
}

async function ensureContent(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { ping: true });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
  }
}

function setToggleUI(on) {
  toggleEl.classList.toggle("active", on);
  toggleText.textContent = on ? "ON" : "OFF";
}

// Init
chrome.storage.local.get(
  ["enabled", "brightness", "tone", "width"],
  async (data) => {
    const enabled = data.enabled ?? false;
    setToggleUI(enabled);

    controls.forEach(k => {
      if (data[k] !== undefined) {
        document.getElementById(k).value = data[k];
      }
    });

    const tab = await getTab();
    if (!tab) return;

    await ensureContent(tab.id);
    chrome.tabs.sendMessage(tab.id, {
      action: "applyState",
      enabled
    });
  }
);

// Toggle
toggleEl.onclick = async () => {
  const { enabled = false } = await chrome.storage.local.get("enabled");
  const next = !enabled;

  chrome.storage.local.set({ enabled: next });
  setToggleUI(next);

  const tab = await getTab();
  if (!tab) return;

  await ensureContent(tab.id);
  chrome.tabs.sendMessage(tab.id, {
    action: "applyState",
    enabled: next
  });
};

// Sliders
controls.forEach(id => {
  document.getElementById(id).oninput = async (e) => {
    const value = parseFloat(e.target.value);
    chrome.storage.local.set({ [id]: value });

    const tab = await getTab();
    if (!tab) return;

    await ensureContent(tab.id);
    chrome.tabs.sendMessage(tab.id, {
      action: "update",
      key: id,
      value
    });
  };
});

// Reset
resetBtn.onclick = async () => {
  const defaults = {
    enabled: false,
    brightness: 0.9,
    tone: 0.5,
    width: 0.045
  };

  chrome.storage.local.set(defaults);
  setToggleUI(false);

  controls.forEach(k => {
    document.getElementById(k).value = defaults[k];
  });

  const tab = await getTab();
  if (!tab) return;

  await ensureContent(tab.id);
  chrome.tabs.sendMessage(tab.id, {
    action: "applyState",
    enabled: false
  });

  controls.forEach(k => {
    chrome.tabs.sendMessage(tab.id, {
      action: "update",
      key: k,
      value: defaults[k]
    });
  });
};
