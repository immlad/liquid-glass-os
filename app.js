let currentUser = "Guest";

const windows = {
  browser: "window-browser",
  movies: "window-movies",
  music: "window-music",
  chat: "window-chat",
  settings: "window-settings",
  notifications: "window-notifications",
  appstore: "window-appstore",
  creator: "window-creator",
};

function centerWindow(win) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = win.getBoundingClientRect();
  win.style.left = (vw - rect.width) / 2 + "px";
  win.style.top = (vh - rect.height) / 2 + "px";
}

/* AUTH / ACCOUNTS (localStorage) */

function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem("lg_accounts") || "{}");
  } catch {
    return {};
  }
}

function saveAccounts(accounts) {
  localStorage.setItem("lg_accounts", JSON.stringify(accounts));
}

function setCurrentUser(name) {
  currentUser = name || "Guest";
  document.getElementById("topbar-user").textContent = currentUser;
  document.getElementById("settings-user").textContent = currentUser;
}

function showOS() {
  document.getElementById("boot-screen").classList.add("hidden");
  document.getElementById("os-shell").classList.remove("hidden");
  setCurrentUser(currentUser);
  addNotification("Welcome", `Signed in as ${currentUser}`);
}

function setupAuth() {
  const tabLogin = document.getElementById("auth-tab-login");
  const tabSignup = document.getElementById("auth-tab-signup");
  const username = document.getElementById("auth-username");
  const password = document.getElementById("auth-password");
  const passwordConfirm = document.getElementById("auth-password-confirm");
  const submit = document.getElementById("auth-submit");
  const status = document.getElementById("auth-status");

  let mode = "login";

  function setMode(m) {
    mode = m;
    if (mode === "login") {
      tabLogin.classList.add("auth-tab-active");
      tabSignup.classList.remove("auth-tab-active");
      passwordConfirm.classList.add("hidden");
      submit.textContent = "Log in";
      status.textContent = "";
    } else {
      tabSignup.classList.add("auth-tab-active");
      tabLogin.classList.remove("auth-tab-active");
      passwordConfirm.classList.remove("hidden");
      submit.textContent = "Sign up";
      status.textContent = "";
    }
  }

  tabLogin.addEventListener("click", () => setMode("login"));
  tabSignup.addEventListener("click", () => setMode("signup"));

  submit.addEventListener("click", () => {
    const user = (username.value || "").trim();
    const pass = (password.value || "").trim();
    const pass2 = (passwordConfirm.value || "").trim();
    if (!user || !pass) {
      status.textContent = "Enter username and password.";
      return;
    }
    const accounts = getAccounts();

    if (mode === "signup") {
      if (pass !== pass2) {
        status.textContent = "Passwords do not match.";
        return;
      }
      if (accounts[user]) {
        status.textContent = "Username already exists.";
        return;
      }
      accounts[user] = { password: pass };
      saveAccounts(accounts);
      status.textContent = "Account created. You can log in now.";
      setMode("login");
      username.value = user;
      password.value = "";
      passwordConfirm.value = "";
      return;
    }

    // login
    if (!accounts[user] || accounts[user].password !== pass) {
      status.textContent = "Invalid username or password.";
      return;
    }
    currentUser = user;
    showOS();
  });

  // auto-login last user if exists
  const lastUser = localStorage.getItem("lg_last_user");
  if (lastUser && getAccounts()[lastUser]) {
    currentUser = lastUser;
    showOS();
  }
}

function openWindow(name) {
  const id = windows[name];
  if (!id) return;
  const win = document.getElementById(id);
  win.classList.remove("hidden");
  bringToFront(win);
  centerWindow(win);
}

function bringToFront(win) {
  const all = Array.from(document.querySelectorAll(".window"));
  const maxZ = all.reduce((m, w) => Math.max(m, parseInt(w.style.zIndex || "20", 10)), 20);
  win.style.zIndex = maxZ + 1;
}

function setupTrafficLights() {
  document.querySelectorAll(".window").forEach(win => {
    win.querySelectorAll(".dot").forEach(dot => {
      dot.addEventListener("click", e => {
        e.stopPropagation();
        const role = dot.dataset.role;
        if (role === "close") win.classList.add("hidden");
        if (role === "minimize") win.classList.add("hidden");
        if (role === "fullscreen") win.classList.toggle("window-fullscreen");
      });
    });
  });
}

function setupWindowDrag() {
  document.querySelectorAll(".window").forEach(win => {
    const header = win.querySelector("[data-drag-handle]");
    if (!header) return;

    let dragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;

    header.addEventListener("mousedown", e => {
      if (e.target.closest(".dot")) return;
      dragging = true;
      bringToFront(win);
      const rect = win.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });

    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      win.style.left = startLeft + dx + "px";
      win.style.top = startTop + dy + "px";
    }

    function onUp() {
      dragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
  });
}

function setupLaunchers() {
  document.querySelectorAll("[data-app]").forEach(el => {
    el.addEventListener("click", () => {
      const app = el.getAttribute("data-app");
      openWindow(app);
      if (app === "notifications") clearNotificationBadge();
    });
  });
}

/* Browser / Apps */

function setupBrowser() {
  const input = document.getElementById("browser-url");
  const go = document.getElementById("browser-go");
  const frame = document.getElementById("browser-frame");

  const defaultUrl = "https://nebulo.bostoncareercounselor.com/test";
  input.value = defaultUrl;

  function nav(urlOverride) {
    const url = (urlOverride || input.value || "").trim();
    if (!url) return;
    const finalUrl = url.startsWith("http") ? url : "https://" + url;
    frame.src = finalUrl;
    addNotification("Browser", `Opened ${finalUrl}`);
  }

  go.addEventListener("click", () => nav());
  input.addEventListener("keydown", e => e.key === "Enter" && nav());
  nav(defaultUrl);
}

function setupMovies() {
  const frame = document.getElementById("movies-frame");
  const movieUrl = "https://nebulo.bostoncareercounselor.com/uv/service/hvtrs8%2F-wuw%2Cckngb%7B.qc-";
  frame.src = movieUrl;
}

function setupMusic() {
  const frame = document.getElementById("music-frame");
  frame.src = "https://vapor.onl/page/music";
}

function setupChat() {
  const frame = document.getElementById("chat-frame");
  frame.src = "https://cdn.jsdelivr.net/gh/immlad/liquid-aura/dist/";
  addNotification("Chat", "Liquid Aura Chat loaded from jsDelivr");
}

/* Clock + widgets */

function setupClock() {
  const el = document.getElementById("topbar-clock");
  const widgetTime = document.getElementById("widget-clock-time");
  const widgetDate = document.getElementById("widget-clock-date");

  function tick() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    if (el) el.textContent = timeStr;
    if (widgetTime) widgetTime.textContent = timeStr;
    if (widgetDate) widgetDate.textContent = dateStr;
  }
  tick();
  setInterval(tick, 30000);
}

/* Theme + wallpaper */

function setupTheme() {
  document.querySelectorAll("[data-theme]").forEach(btn => {
    btn.addEventListener("click", () => {
      const theme = btn.getAttribute("data-theme");
      document.body.style.backgroundImage = "";

      if (theme === "white") {
        document.body.style.background =
          "radial-gradient(circle at top, #ffffff 0, #e5e7eb 40%, #e5e7eb 100%)";
      } else if (theme === "dark") {
        document.body.style.background =
          "radial-gradient(circle at top, #020617 0, #020617 40%, #020617 100%)";
      } else {
        document.body.style.background =
          "radial-gradient(circle at top, #ffffff 0, #e0f2fe 30%, #e0e7ff 60%, #f5d0fe 100%)";
      }

      addNotification("Theme", `Switched to ${theme} theme`);
    });
  });
}

function setupWallpapers() {
  document.querySelectorAll("[data-wallpaper]").forEach(btn => {
    btn.addEventListener("click", () => {
      const wp = btn.getAttribute("data-wallpaper");
      document.body.style.backgroundImage = "";

      if (wp === "sky") {
        document.body.style.background =
          "radial-gradient(circle at top, #e0f2fe 0, #bae6fd 40%, #7dd3fc 100%)";
      } else if (wp === "neutral") {
        document.body.style.background =
          "radial-gradient(circle at top, #f9fafb 0, #e5e7eb 40%, #d1d5db 100%)";
      } else {
        document.body.style.background =
          "radial-gradient(circle at top, #ffffff 0, #e0f2fe 30%, #e0e7ff 60%, #f5d0fe 100%)";
      }

      addNotification("Wallpaper", `Changed wallpaper to ${wp}`);
    });
  });

  const upload = document.getElementById("wallpaper-upload");
  upload.addEventListener("change", () => {
    const file = upload.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      document.body.style.backgroundImage = `url('${e.target.result}')`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center center";
      document.body.style.backgroundRepeat = "no-repeat";
      addNotification("Wallpaper", "Custom wallpaper applied");
    };
    reader.readAsDataURL(file);
  });
}

/* Notifications */

function addNotification(title, message) {
  const list = document.getElementById("notifications-list");
  const li = document.createElement("li");
  li.className = "glass-strong px-3 py-2 rounded-2xl text-[11px] text-center";
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  li.innerHTML = `<div class="font-semibold mb-0.5">${title}</div>
                  <div class="opacity-80">${message}</div>
                  <div class="text-[10px] opacity-60 mt-1">${time}</div>`;
  list.prepend(li);
  showNotificationBadge();
  updateNotificationWidgetCount();
}

function showNotificationBadge() {
  document.getElementById("notif-badge").classList.remove("hidden");
}

function clearNotificationBadge() {
  document.getElementById("notif-badge").classList.add("hidden");
}

function updateNotificationWidgetCount() {
  const list = document.getElementById("notifications-list");
  const count = list ? list.children.length : 0;
  const el = document.getElementById("widget-notifs-count");
  if (el) el.textContent = String(count);
}

/* Web App Creator */

function setupCreator() {
  const nameInput = document.getElementById("creator-name");
  const urlInput = document.getElementById("creator-url");
  const addBtn = document.getElementById("creator-add");
  const status = document.getElementById("creator-status");
  const desktop = document.getElementById("desktop-icons");

  addBtn.addEventListener("click", () => {
    const name = (nameInput.value || "").trim();
    const url = (urlInput.value || "").trim();
    if (!name || !url) {
      status.textContent = "Please enter both name and URL.";
      return;
    }

    const id = "custom-" + Date.now();
    const icon = document.createElement("div");
    icon.className = "desktop-icon";
    icon.setAttribute("data-app", id);
    icon.innerHTML = `
      <div class="icon-glass">🌐</div>
      <span class="text-[11px] mt-1">${name}</span>
    `;
    desktop.appendChild(icon);

    const win = document.createElement("div");
    win.id = "window-" + id;
    win.className = "window glass hidden";
    win.innerHTML = `
      <div class="window-header" data-drag-handle>
        <div class="window-controls">
          <span class="dot" data-role="close"></span>
          <span class="dot" data-role="minimize"></span>
          <span class="dot" data-role="fullscreen"></span>
        </div>
        <div class="text-xs font-medium flex-1 text-center">${name}</div>
      </div>
      <div class="window-body text-center rounded-b-2xl">
        <iframe class="window-iframe rounded-b-2xl" src="${url}"></iframe>
      </div>
    `;
    document.getElementById("os-shell").appendChild(win);

    windows[id] = "window-" + id;
    setupTrafficLights();
    setupWindowDrag();
    icon.addEventListener("dblclick", () => openWindow(id));
    setupDesktopIconDrag(icon);

    status.textContent = `Added "${name}" to desktop.`;
    addNotification("Web App Creator", `Added ${name}`);
  });
}

/* Widgets */

function setupWidgets() {
  setupWidgetDrag();

  const weatherMain = document.getElementById("widget-weather-main");
  const weatherTemp = document.getElementById("widget-weather-temp");
  if (weatherMain && weatherTemp) {
    weatherMain.textContent = "Portland";
    const temp = 16 + Math.floor(Math.random() * 6);
    weatherTemp.textContent = `${temp}°C • Clear`;
  }

  const nowBtn = document.getElementById("widget-nowplaying-open");
  if (nowBtn) {
    nowBtn.addEventListener("click", () => openWindow("music"));
  }

  const notifBtn = document.getElementById("widget-notifs-open");
  if (notifBtn) {
    notifBtn.addEventListener("click", () => openWindow("notifications"));
  }

  updateNotificationWidgetCount();
  setupSystemWidget();
}

function setupSystemWidget() {
  const cpuEl = document.getElementById("widget-system-cpu");
  const ramEl = document.getElementById("widget-system-ram");
  const batEl = document.getElementById("widget-system-battery");

  function update() {
    if (cpuEl) cpuEl.textContent = `CPU: ${30 + Math.floor(Math.random() * 40)}%`;
    if (ramEl) ramEl.textContent = `RAM: ${40 + Math.floor(Math.random() * 40)}%`;

    if (navigator.getBattery) {
      navigator.getBattery().then(b => {
        if (batEl) batEl.textContent = `Battery: ${Math.round(b.level * 100)}%`;
      }).catch(() => {
        if (batEl) batEl.textContent = "Battery: --%";
      });
    } else if (batEl) {
      batEl.textContent = "Battery: --%";
    }
  }

  update();
  setInterval(update, 30000);
}

/* Widget drag + snap */

function setupWidgetDrag() {
  const widgets = document.querySelectorAll(".widget");
  widgets.forEach(widget => {
    let dragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;

    widget.addEventListener("mousedown", e => {
      dragging = true;
      widget.classList.add("widget-dragging");
      const rect = widget.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });

    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      widget.style.left = startLeft + dx + "px";
      widget.style.top = startTop + dy + "px";
      widget.style.right = "auto";
      widget.style.bottom = "auto";
      widget.style.transform = "none";
    }

    function onUp() {
      if (!dragging) return;
      dragging = false;
      widget.classList.remove("widget-dragging");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      snapWidget(widget);
    }
  });
}

function snapWidget(widget) {
  const margin = 16;
  const rect = widget.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const positions = [
    { x: margin, y: 64 },
    { x: vw - rect.width - margin, y: 64 },
    { x: margin, y: vh - rect.height - margin - 60 },
    { x: vw - rect.width - margin, y: vh - rect.height - margin - 60 },
    { x: (vw - rect.width) / 2, y: vh - rect.height - margin - 60 },
  ];

  let best = positions[0];
  let bestDist = Infinity;
  positions.forEach(pos => {
    const dx = centerX - (pos.x + rect.width / 2);
    const dy = centerY - (pos.y + rect.height / 2);
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = pos;
    }
  });

  widget.style.left = best.x + "px";
  widget.style.top = best.y + "px";
  widget.style.right = "auto";
  widget.style.bottom = "auto";
  widget.style.transform = "none";
}

/* Desktop icons drag + snap */

function setupDesktopIcons() {
  const container = document.getElementById("desktop-icons");
  const icons = Array.from(container.querySelectorAll(".desktop-icon"));

  // initial grid positions
  const cols = 4;
  const cellW = 90;
  const cellH = 90;
  const startX = - (cols * cellW) / 2 + cellW / 2;
  const startY = 0;

  icons.forEach((icon, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * cellW;
    const y = startY + row * cellH;
    icon.style.position = "absolute";
    icon.style.left = `calc(50% + ${x}px)`;
    icon.style.top = `${80 + y}px`;
    setupDesktopIconDrag(icon);
    icon.addEventListener("dblclick", () => {
      const app = icon.getAttribute("data-app");
      openWindow(app);
      if (app === "notifications") clearNotificationBadge();
    });
  });
}

function setupDesktopIconDrag(icon) {
  let dragging = false;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;

  icon.addEventListener("mousedown", e => {
    dragging = true;
    const rect = icon.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  function onMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    icon.style.left = startLeft + dx + "px";
    icon.style.top = startTop + dy + "px";
  }

  function onUp() {
    if (!dragging) return;
    dragging = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    snapDesktopIcon(icon);
  }
}

function snapDesktopIcon(icon) {
  const rect = icon.getBoundingClientRect();
  const vw = window.innerWidth;
  const cellW = 90;
  const cellH = 90;
  const offsetTop = 80;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const col = Math.round((centerX - vw / 2) / cellW);
  const row = Math.max(0, Math.round((centerY - offsetTop) / cellH));

  const x = col * cellW;
  const y = row * cellH;

  icon.style.left = `calc(50% + ${x}px)`;
  icon.style.top = `${offsetTop + y}px`;
}

/* INIT */

window.addEventListener("DOMContentLoaded", () => {
  setupAuth();
  setupTrafficLights();
  setupWindowDrag();
  setupLaunchers();
  setupBrowser();
  setupMovies();
  setupMusic();
  setupChat();
  setupClock();
  setupTheme();
  setupWallpapers();
  setupCreator();
  setupWidgets();
  setupDesktopIcons();
});
