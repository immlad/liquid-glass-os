// Window management
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
  const maxZ = Array.from(document.querySelectorAll(".window")).reduce(
    (max, w) => Math.max(max, parseInt(window.getComputedStyle(w).zIndex || "10", 10)),
    10
  );
  win.style.zIndex = maxZ + 1;
}

// Launchers
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

// Close buttons
function setupCloseButtons() {
  document.querySelectorAll(".btn-close[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeWindowById(btn.getAttribute("data-close"));
    });
  });
}

// Browser
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

  // WebSocket backend
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

// Themes
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

// Web App Creator
function createCustomApp(name, url) {
  const id = "webapp-" + Date.now();

  // Desktop icon
  const desktop = document.getElementById("desktop-custom-apps");
  const icon = document.createElement("div");
  icon.className = "desktop-icon";
  icon.dataset.appId = id;
  icon.innerHTML = `<div class="icon-circle icon-webapp"></div><span>${name}</span>`;
  desktop.appendChild(icon);

  // Dock icon
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
  bringToFront(win);
}

function setupWebAppCreator() {
  const form = document.getElementById("webapp-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    createCustomApp(
      document.getElementById("webapp-name").value.trim(),
      document.getElementById("webapp-url").value.trim()
    );
    form.reset();
  });
}

// Window focus
function setupWindowFocus() {
  document.querySelectorAll(".window").forEach((win) => {
    win.addEventListener("mousedown", () => bringToFront(win));
  });
}

// Init
window.addEventListener("DOMContentLoaded", () => {
  setupLaunchers();
  setupCloseButtons();
  setupBrowser();
  setupThemes();
  setupWebAppCreator();
  setupWindowFocus();
});
