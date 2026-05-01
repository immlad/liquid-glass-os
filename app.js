let currentUser = "Guest";

const windows = {
  browser: "window-browser",
  chat: "window-chat",
  settings: "window-settings",
  notifications: "window-notifications",
};

function showLogin() {
  document.getElementById("boot-screen").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
}

function showOS() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("os-shell").classList.remove("hidden");
  document.getElementById("topbar-user").textContent = currentUser;
  document.getElementById("settings-user").textContent = currentUser;
  addNotification("Welcome", `Signed in as ${currentUser}`);
}

function openWindow(name) {
  const id = windows[name];
  if (!id) return;
  const win = document.getElementById(id);
  win.classList.remove("hidden");
  bringToFront(win);
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

function setupDrag() {
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

function setupBrowser() {
  const input = document.getElementById("browser-url");
  const go = document.getElementById("browser-go");
  const frame = document.getElementById("browser-frame");

  function nav() {
    const url = (input.value || "").trim();
    if (!url) return;
    frame.src = url.startsWith("http") ? url : "https://" + url;
  }

  go.addEventListener("click", nav);
  input.addEventListener("keydown", e => e.key === "Enter" && nav());
}

function setupChat() {
  const frame = document.getElementById("chat-frame");
  frame.src = "https://cdn.jsdelivr.net/gh/immlad/liquid-aura/liquid-aura/dist/index.html";
}

function setupClock() {
  const el = document.getElementById("topbar-clock");
  function tick() {
    el.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  tick();
  setInterval(tick, 30000);
}

function setupTheme() {
  document.querySelectorAll("[data-theme]").forEach(btn => {
    btn.addEventListener("click", () => {
      const theme = btn.getAttribute("data-theme");
      if (theme === "white") {
        document.body.style.background =
          "radial-gradient(circle at top, #ffffff 0, #e5e7eb 40%, #e5e7eb 100%)";
      } else {
        document.body.style.background =
          "radial-gradient(circle at top, #ffffff 0, #e0f2fe 30%, #e0e7ff 60%, #f5d0fe 100%)";
      }
      addNotification("Theme", `Switched to ${theme} theme`);
    });
  });
}

// Notifications
function addNotification(title, message) {
  const list = document.getElementById("notifications-list");
  const li = document.createElement("li");
  li.className = "glass-strong px-3 py-2 rounded-lg text-[11px]";
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  li.innerHTML = `<div class="font-semibold mb-0.5">${title}</div>
                  <div class="opacity-80">${message}</div>
                  <div class="text-[10px] opacity-60 mt-1">${time}</div>`;
  list.prepend(li);
  showNotificationBadge();
}

function showNotificationBadge() {
  document.getElementById("notif-badge").classList.remove("hidden");
}

function clearNotificationBadge() {
  document.getElementById("notif-badge").classList.add("hidden");
}

// Init
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(showLogin, 1200);

  document.getElementById("login-button").addEventListener("click", () => {
    const name = (document.getElementById("login-name").value || "").trim();
    currentUser = name || "Guest";
    showOS();
  });

  setupTrafficLights();
  setupDrag();
  setupLaunchers();
  setupBrowser();
  setupChat();
  setupClock();
  setupTheme();
});
