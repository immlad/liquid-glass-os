// Minimal working OS logic

function openWindow(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeWindow(win) {
  win.classList.add("hidden");
}

function setupTrafficLights() {
  document.querySelectorAll(".window").forEach(win => {
    win.querySelectorAll(".dot").forEach(dot => {
      dot.onclick = e => {
        const role = dot.dataset.role;
        if (role === "close") closeWindow(win);
        if (role === "minimize") win.classList.add("hidden");
        if (role === "fullscreen") win.classList.toggle("window-fullscreen");
      };
    });
  });
}

function setupLaunchers() {
  document.querySelectorAll("[data-app]").forEach(icon => {
    icon.onclick = () => openWindow("window-" + icon.dataset.app);
  });
}

function setupChat() {
  document.getElementById("chatcord-frame").src =
    "https://cdn.jsdelivr.net/gh/immlad/liquid-aura/liquid-aura/dist/index.html";
}

function setupClock() {
  const el = document.getElementById("topbar-clock");
  setInterval(() => {
    el.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, 1000);
}

window.onload = () => {
  setupTrafficLights();
  setupLaunchers();
  setupChat();
  setupClock();

  setTimeout(() => {
    document.getElementById("boot-screen").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
  }, 1200);

  document.getElementById("login-button").onclick = () => {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("os-shell").classList.remove("hidden");
  };
};
