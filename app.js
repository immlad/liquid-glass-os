// ---------- BOOT + LOGIN FLOW ----------
function showLogin() {
  const boot = document.getElementById("boot-screen");
  const login = document.getElementById("login-screen");
  boot.classList.add("hidden");
  login.classList.remove("hidden");
}

function showOS() {
  const login = document.getElementById("login-screen");
  const os = document.getElementById("os-shell");
  login.classList.add("hidden");
  os.classList.remove("hidden");
}

function setupBootAndLogin() {
  setTimeout(showLogin, 1800);

  const loginBtn = document.getElementById("login-button");
  loginBtn.addEventListener("click", () => {
    const name = document.getElementById("login-name").value.trim();
    if (name) {
      localStorage.setItem("lgosUserName", name);
    }
    showOS();
  });
}

// ---------- WINDOW MANAGEMENT ----------
const windows = {
  browser: document.getElementById("window-browser"),
  movies: document.getElementById("window-movies"),
  settings: document.getElementById("window-settings"),
};

function openWindow(name) {
  const win = windows[name];
  if (!win) return;
  win.classList.remove("hidden");
  bringToFront(win);
}

function closeWindowById(id) {
  const win = document.getElementById(id);
  if (win) win.classList.add("hidden");
}

function bringToFront(win) {
  const all = Array.from(document.querySelectorAll(".window"));
  const maxZ = all.reduce(
    (max, w) => Math.max(max, parseInt(window.getComputedStyle(w).zIndex || "10", 10)),
    10
  );
  win.style.zIndex = maxZ + 1;
}

// ---------- DRAGGABLE WINDOWS ----------
function makeWindowDraggable(win) {
  const header = win.querySelector("[data-drag-handle]");
  if (!header) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    bringToFront(win);
    const rect = win.getBoundingClientRect();
    const shellRect = document.getElementById("os-shell").getBoundingClientRect();

    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left - shellRect.left;
    startTop = rect.top - shellRect.top;

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  function onMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    win.style.left = startLeft + dx + "px";
    win.style.top = startTop + dy + "px";
  }

  function onUp() {
    isDragging = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }
}

function setupWindowDrag() {
  document.querySelectorAll(".window").forEach((win) => makeWindowDraggable(win));
}

// ---------- LAUNCHERS ----------
function setupLaunchers() {
  document.querySelectorAll("[data-app]").forEach((el) => {
    el.addEventListener("click", () => {
      const app = el.getAttribute("data-app");
      if (app === "webapp-creator") {
        openWindow("settings");
        document.getElementById("webapp-form").scrollIntoView({ behavior: "smooth" });
      } else {
        openWindow(app);
      }
    });
  });
}

// ---------- CLOSE BUTTONS ----------
function setupCloseButtons() {
  document.querySelectorAll(".btn-close[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeWindowById(btn.getAttribute("data-close"));
    });
  });
}

// ---------- BROWSER ----------
function setupBrowser() {
  const input = document.getElementById("browser-url");
  const goBtn = document.getElementById("browser-go");
  const frame = document.getElementById("browser-frame");

  function navigate() {
    const url = input.value.trim();
    if (!url) return;
    frame.src = url.startsWith("http") ? url : "https://" + url;
  }

  goBtn.addEventListener("click", navigate);
  input.addEventListener("keydown", (e) => e.key === "Enter" && navigate());

  const statusEl = document.getElementById("browser-backend-status");
  try {
    const ws = new WebSocket("wss://anura.pro/");
    ws.addEventListener("open", () => (statusEl.textContent = "connected"));
    ws.addEventListener("close", () => (statusEl.textContent = "disconnected"));
    ws.addEventListener("error", () => (statusEl.textContent = "error"));
  } catch {
    statusEl.textContent = "error";
  }
}

// ---------- THEMES ----------
function setupThemes() {
  document.querySelectorAll(".theme-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.getAttribute("data-theme");
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("liquidGlassTheme", theme);
    });
  });

  const saved = localStorage.getItem("liquidGlassTheme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
}

// ---------- WALLPAPERS ----------
function applyWallpaper(id) {
  const desktop = document.getElementById("desktop");
  desktop.classList.remove("wallpaper-1", "wallpaper-2", "wallpaper-3");
  desktop.classList.add("wallpaper-" + id);
  localStorage.setItem("liquidGlassWallpaper", id);
}

function setupWallpapers() {
  document.querySelectorAll(".wallpaper-thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-wallpaper");
      applyWallpaper(id);
    });
  });

  const saved = localStorage.getItem("liquidGlassWallpaper");
  if (saved) applyWallpaper(saved);
}

// ---------- WEB APP CREATOR (PERSISTENT) ----------
function createCustomApp(name, url, idFromStorage) {
  const id = idFromStorage || "webapp-" + Date.now();

  const desktop = document.getElementById("desktop-custom-apps");
  const icon = document.createElement("div");
  icon.className = "desktop-icon";
  icon.dataset.appId = id;
  icon.innerHTML = `<div class="icon-circle icon-webapp"></div><span>${name}</span>`;
  desktop.appendChild(icon);

  const dock = document.getElementById("dock-custom-apps");
  const dockBtn = document.createElement("button");
  dockBtn.className = "dock-icon";
  dockBtn.dataset.appId = id;
  dockBtn.innerHTML = `<div class="icon-circle icon-webapp"></div>`;
  dock.appendChild(dockBtn);

  function openCustom() {
    openWebAppWindow(name, url);
  }

  icon.addEventListener("click", openCustom);
  dockBtn.addEventListener("click", openCustom);

  return id;
}

function openWebAppWindow(name, url) {
  const template = document.getElementById("window-webapp-template");
  const win = template.cloneNode(true);
  win.id = "window-" + Date.now();
  win.classList.remove("hidden");

  win.querySelector(".webapp-title").textContent = name;
  win.querySelector("iframe").src = url;

  win.querySelector(".btn-close").addEventListener("click", () => win.remove());

  document.querySelector(".os-shell").appendChild(win);
  makeWindowDraggable(win);
  bringToFront(win);
}

function saveCustomApps(apps) {
  localStorage.setItem("liquidGlassApps", JSON.stringify(apps));
}

function loadCustomApps() {
  try {
    const raw = localStorage.getItem("liquidGlassApps");
    if (!raw) return [];
    const apps = JSON.parse(raw);
    apps.forEach((app) => {
      createCustomApp(app.name, app.url, app.id);
    });
    return apps;
  } catch {
    return [];
  }
}

function setupWebAppCreator() {
  const form = document.getElementById("webapp-form");
  const nameInput = document.getElementById("webapp-name");
  const urlInput = document.getElementById("webapp-url");

  let apps = loadCustomApps();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    if (!name || !url) return;

    const id = createCustomApp(name, url);
    apps.push({ id, name, url });
    saveCustomApps(apps);

    form.reset();
  });
}

// ---------- WINDOW FOCUS ----------
function setupWindowFocus() {
  document.querySelectorAll(".window").forEach((win) => {
    win.addEventListener("mousedown", () => bringToFront(win));
  });
}

// ---------- INIT ----------
window.addEventListener("DOMContentLoaded", () => {
  setupBootAndLogin();
  setupLaunchers();
  setupCloseButtons();
  setupBrowser();
  setupThemes();
  setupWallpapers();
  setupWebAppCreator();
  setupWindowFocus();
  setupWindowDrag();
});
