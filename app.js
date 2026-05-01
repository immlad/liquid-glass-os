// ---------- PROFILES ----------
function loadProfiles() {
  try {
    const raw = localStorage.getItem("lgosProfiles");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveProfiles(profiles) {
  localStorage.setItem("lgosProfiles", JSON.stringify(profiles));
}

function setActiveProfile(profile) {
  localStorage.setItem("lgosActiveProfile", JSON.stringify(profile));
  const topUser = document.getElementById("topbar-user");
  if (topUser) topUser.textContent = profile.name || "Guest";
}

function getActiveProfile() {
  try {
    const raw = localStorage.getItem("lgosActiveProfile");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function renderProfileList() {
  const list = document.getElementById("profile-list");
  const profiles = loadProfiles();
  list.innerHTML = "";

  profiles.forEach((p, index) => {
    const item = document.createElement("div");
    item.className = "profile-item";
    item.innerHTML = `
      <span>${p.name}</span>
      <div>
        <button data-profile-index="${index}" data-action="use">Use</button>
        <button data-profile-index="${index}" data-action="delete">✕</button>
      </div>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-profile-index"), 10);
      const action = btn.getAttribute("data-action");
      const profiles = loadProfiles();
      if (action === "use") {
        const profile = profiles[idx];
        setActiveProfile(profile);
        showOS();
        addNotification("Profile", `Signed in as ${profile.name}`);
      } else if (action === "delete") {
        profiles.splice(idx, 1);
        saveProfiles(profiles);
        renderProfileList();
      }
    });
  });
}

// ---------- BOOT + LOGIN FLOW ----------
function showLogin() {
  const boot = document.getElementById("boot-screen");
  const login = document.getElementById("login-screen");
  boot.classList.add("hidden");
  login.classList.remove("hidden");
  renderProfileList();
}

function showOS() {
  const login = document.getElementById("login-screen");
  const os = document.getElementById("os-shell");
  login.classList.add("hidden");
  os.classList.remove("hidden");

  const active = getActiveProfile();
  if (active) {
    setActiveProfile(active);
  } else {
    setActiveProfile({ name: "Guest" });
  }
}

function setupBootAndLogin() {
  setTimeout(showLogin, 1800);

  const loginBtn = document.getElementById("login-button");
  loginBtn.addEventListener("click", () => {
    const name = document.getElementById("login-name").value.trim() || "Guest";
    const profiles = loadProfiles();
    const profile = { id: Date.now(), name };
    profiles.push(profile);
    saveProfiles(profiles);
    setActiveProfile(profile);
    showOS();
    addNotification("Profile", `Created and signed in as ${name}`);
  });

  const switchUserBtn = document.getElementById("btn-switch-user");
  switchUserBtn.addEventListener("click", () => {
    document.getElementById("os-shell").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
    renderProfileList();
  });
}

// ---------- WINDOW MANAGEMENT ----------
const windows = {
  browser: document.getElementById("window-browser"),
  movies: document.getElementById("window-movies"),
  settings: document.getElementById("window-settings"),
  chatcord: document.getElementById("window-chatcord"),
  appstore: document.getElementById("window-appstore"),
  notifications: document.getElementById("window-notifications"),
};

function openWindow(name) {
  const win = windows[name];
  if (!win) return;
  win.classList.remove("hidden");
  win.classList.remove("window-fullscreen");
  bringToFront(win);
  bounceDockIcon(name);
}

function closeWindow(win) {
  win.classList.add("hidden");
}

function minimizeWindow(win) {
  win.classList.add("hidden");
}

function toggleFullscreenWindow(win) {
  win.classList.toggle("window-fullscreen");
  bringToFront(win);
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
    if (e.target.closest(".window-controls")) return;
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

// ---------- macOS TRAFFIC LIGHTS ----------
function setupTrafficLights() {
  document.querySelectorAll(".window").forEach((win) => {
    const controls = win.querySelector(".window-controls");
    if (!controls) return;

    controls.querySelectorAll(".dot").forEach((dot) => {
      const role = dot.getAttribute("data-role");
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        if (role === "close") {
          closeWindow(win);
        } else if (role === "minimize") {
          minimizeWindow(win);
        } else if (role === "fullscreen") {
          toggleFullscreenWindow(win);
        }
      });
    });
  });
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

  document.querySelectorAll("[data-open-app]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const app = btn.getAttribute("data-open-app");
      openWindow(app);
    });
  });

  document.getElementById("btn-appstore").addEventListener("click", () => {
    openWindow("appstore");
  });

  document.getElementById("btn-notifications").addEventListener("click", () => {
    openWindow("notifications");
    clearNotificationBadge();
  });
}

// ---------- DOCK BOUNCE ----------
function bounceDockIcon(appName) {
  const dockBtn = document.querySelector(`.dock-icon[data-app="${appName}"]`);
  if (!dockBtn) return;
  const wrapper = dockBtn.querySelector(".dock-icon-wrapper");
  if (!wrapper) return;

  wrapper.style.transition = "transform 0.15s ease-out, margin-bottom 0.15s ease-out";
  wrapper.style.transform = "translateY(-8px) scale(1.2)";
  wrapper.style.marginBottom = "6px";

  setTimeout(() => {
    wrapper.style.transform = "";
    wrapper.style.marginBottom = "";
  }, 180);
}

// ---------- CLOSE BUTTONS (legacy) ----------
function setupCloseButtons() {
  document.querySelectorAll(".btn-close[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeWindow(document.getElementById(btn.getAttribute("data-close")));
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
      addNotification("Theme", `Switched to ${theme} theme`);
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
      addNotification("Wallpaper", `Wallpaper ${id} applied`);
    });
  });

  const saved = localStorage.getItem("liquidGlassWallpaper");
  if (saved) applyWallpaper(saved);
}

// ---------- WEB APP CREATOR ----------
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
  dockBtn.innerHTML = `<div class="dock-icon-wrapper"><div class="icon-circle icon-webapp"></div></div>`;
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

  const controls = win.querySelector(".window-controls");
  controls.querySelectorAll(".dot").forEach((dot) => {
    const role = dot.getAttribute("data-role");
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      if (role === "close") {
        win.remove();
      } else if (role === "minimize") {
        win.classList.add("hidden");
      } else if (role === "fullscreen") {
        toggleFullscreenWindow(win);
      }
    });
  });

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
    addNotification("Web App", `Created app "${name}"`);
    form.reset();
  });
}

// ---------- NOTIFICATIONS ----------
function loadNotifications() {
  try {
    const raw = localStorage.getItem("liquidGlassNotifications");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveNotifications(notifs) {
  localStorage.setItem("liquidGlassNotifications", JSON.stringify(notifs));
}

function renderNotifications() {
  const list = document.getElementById("notifications-list");
  const notifs = loadNotifications();
  list.innerHTML = "";
  notifs
    .slice()
    .reverse()
    .forEach((n) => {
      const li = document.createElement("li");
      li.className = "notification-item";
      li.innerHTML = `
        <div class="notification-item-title">${n.title}</div>
        <div>${n.message}</div>
        <div class="notification-item-time">${n.time}</div>
      `;
      list.appendChild(li);
    });
}

function addNotification(title, message) {
  const notifs = loadNotifications();
  const time = new Date().toLocaleTimeString();
  notifs.push({ title, message, time });
  saveNotifications(notifs);
  renderNotifications();
  showNotificationBadge();
}

function showNotificationBadge() {
  const badge = document.getElementById("notif-badge");
  badge.classList.remove("hidden");
}

function clearNotificationBadge() {
  const badge = document.getElementById("notif-badge");
  badge.classList.add("hidden");
}

// ---------- CHATCORD (GLOBAL SOCKET.IO) ----------
let chatSocket = null;
let chatCurrentRoom = "general";

function getChatUserName() {
  const profile = getActiveProfile();
  return profile?.name || "Guest";
}

function connectChatcordSocket() {
  try {
    chatSocket = io("https://liquid-aura.vercel.app/app"); // connects to same origin where server.js runs
  } catch (e) {
    console.error("Socket.io not available", e);
    return;
  }

  const user = getChatUserName();
  chatSocket.emit("joinRoom", { username: user, room: chatCurrentRoom });

  chatSocket.on("message", (msg) => {
    appendChatMessage(msg);
  });

  chatSocket.on("roomUsers", ({ room }) => {
    const label = document.getElementById("chatcord-room-label");
    if (label) label.textContent = "# " + room;
  });
}

function appendChatMessage(msg) {
  const container = document.getElementById("chatcord-messages");
  if (!container) return;
  const div = document.createElement("div");
  div.className = "chatcord-message";
  div.innerHTML = `
    <div class="chatcord-message-user">${msg.username}</div>
    <div>${msg.text}</div>
    <div class="chatcord-message-meta">${msg.time}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function setupChatcord() {
  const roomList = document.getElementById("chatcord-rooms");
  const roomLabel = document.getElementById("chatcord-room-label");
  const userLabel = document.getElementById("chatcord-user-label");
  const form = document.getElementById("chatcord-form");
  const input = document.getElementById("chatcord-input");

  userLabel.textContent = getChatUserName();

  // connect socket once
  connectChatcordSocket();

  roomList.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      roomList.querySelectorAll("li").forEach((x) => x.classList.remove("active"));
      li.classList.add("active");
      const room = li.getAttribute("data-room");
      chatCurrentRoom = room;
      roomLabel.textContent = "# " + room;
      input.placeholder = "Message #" + room;

      if (chatSocket) {
        chatSocket.emit("joinRoom", {
          username: getChatUserName(),
          room,
        });
      }

      const container = document.getElementById("chatcord-messages");
      container.innerHTML = "";
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || !chatSocket) return;
    chatSocket.emit("chatMessage", text);
    input.value = "";
  });
}

// ---------- WINDOW FOCUS ----------
function setupWindowFocus() {
  document.querySelectorAll(".window").forEach((win) => {
    win.addEventListener("mousedown", () => bringToFront(win));
  });
}

// ---------- CLOCK ----------
function setupClock() {
  const el = document.getElementById("topbar-clock");
  function tick() {
    const now = new Date();
    el.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  tick();
  setInterval(tick, 30000);
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
  setupTrafficLights();
  setupChatcord();
  renderNotifications();
  setupClock();
});
