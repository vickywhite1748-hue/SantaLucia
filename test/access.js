(function () {
  "use strict";

  const CONFIG = {
    accessMode: "__TEST_ACCESS__",
    windows: "__TEST_OPEN_WINDOWS_HK__",
    buildTime: "__TEST_BUILD_TIME__",
    openUntilHk: "2026-05-20 00:00:00",
    playHref: "play.html"
  };

  function cleanTemplateValue(value) {
    if (!value || /^__.+__$/.test(value)) return "";
    return String(value).trim();
  }

  function getPageKind() {
    const script = document.currentScript;
    return script?.dataset?.testPage || document.body?.dataset?.testPage || "play";
  }

  function getHongKongTime(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Hong_Kong",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).formatToParts(date).reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      time: `${parts.hour}:${parts.minute}`,
      full: `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`
    };
  }

  function parseWindows(rawWindows) {
    return cleanTemplateValue(rawWindows)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const match = item.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
        return match ? { label: `${match[1]}-${match[2]}`, start: match[1], end: match[2] } : null;
      })
      .filter(Boolean);
  }

  function isInsideWindow(now, window) {
    if (window.start === window.end) return false;
    if (window.start < window.end) return now >= window.start && now < window.end;
    return now >= window.start || now < window.end;
  }

  function getAccessState() {
    const mode = cleanTemplateValue(CONFIG.accessMode) || "auto";
    const windows = parseWindows(CONFIG.windows);
    const hk = getHongKongTime();
    const openByWindow = windows.some((window) => isInsideWindow(hk.time, window));
    const openUntilHk = cleanTemplateValue(CONFIG.openUntilHk);
    const openByDeadline = Boolean(openUntilHk && hk.full < openUntilHk);
    let open = false;

    if (mode === "closed") {
      open = false;
    } else if (openByDeadline) {
      open = true;
    } else if (windows.length) {
      open = openByWindow;
    } else {
      open = mode === "open";
    }

    return { mode, windows, hk, open, openUntilHk };
  }

  function updateEntryPage(state) {
    const title = document.getElementById("testTitle");
    const message = document.getElementById("testMessage");
    const now = document.getElementById("testNow");
    const windows = document.getElementById("testWindows");
    const mode = document.getElementById("testMode");
    const enterLink = document.getElementById("testEnterLink");
    const refreshButton = document.getElementById("testRefreshButton");

    if (now) now.textContent = state.hk.full;
    if (windows) windows.textContent = state.openUntilHk ? `开放至 ${state.openUntilHk}` : (state.windows.length ? state.windows.map((item) => item.label).join(", ") : "\u672a\u914d\u7f6e");
    if (mode) mode.textContent = `${state.mode}${cleanTemplateValue(CONFIG.buildTime) ? ` | ${cleanTemplateValue(CONFIG.buildTime)}` : ""}`;

    if (state.open) {
      if (title) title.textContent = "\u6d4b\u8bd5\u5165\u53e3\u5df2\u5f00\u653e";
      if (message) message.textContent = "\u5c06\u8fdb\u5165\u6d4b\u8bd5\u7248\u3002\u82e5\u6ca1\u6709\u81ea\u52a8\u8df3\u8f6c\uff0c\u53ef\u4ee5\u624b\u52a8\u70b9\u51fb\u8fdb\u5165\u3002";
      if (enterLink) enterLink.hidden = false;
      window.setTimeout(() => {
        window.location.replace(CONFIG.playHref + window.location.search + window.location.hash);
      }, 700);
    } else {
      if (title) title.textContent = "\u6d4b\u8bd5\u5165\u53e3\u5df2\u5173\u95ed";
      if (message) message.textContent = "\u5f53\u524d\u4e0d\u5728\u7ea6\u5b9a\u6d4b\u8bd5\u65f6\u6bb5\u5185\uff0c\u8bf7\u4f7f\u7528\u6b63\u5f0f\u7248\u5165\u53e3\u3002";
      if (enterLink) enterLink.hidden = true;
    }

    if (refreshButton) {
      refreshButton.onclick = () => updateEntryPage(getAccessState());
    }
  }

  function guardPlayPage(state) {
    if (state.open) return;
    window.location.replace("index.html?closed=1");
  }

  const state = getAccessState();
  if (getPageKind() === "entry") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => updateEntryPage(getAccessState()), { once: true });
    } else {
      updateEntryPage(state);
    }
  } else {
    guardPlayPage(state);
  }
})();
