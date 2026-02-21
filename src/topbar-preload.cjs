const { ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
  const logoPath = `<path fill="#005ed9" d="M133.15,14.8h-7.69v7.69h7.69v-7.69Zm-26.9,53.84v-15.4h0s15.37,0,15.37,0v15.38h15.37c.26,14.25-.82,26.68-8.06,39.12-20.96,36.88-72.74,41.85-100.21,9.49h0c-6.41-7.45-11.02-16.51-13.18-26.18-1.1-5.25-1.58-11.92-1.58-17.55V15.76h30.75l.06,58.57c.15,7.58,1.52,15.37,6.05,21.31,13.04,17.66,40.64,16.06,51.33-3.18,3.84-6.42,4.19-16.61,4.09-23.82h0Zm3.84-42.31h11.53v11.53h15.38v15.38h-15.38v-15.37h-11.53v-11.53Z"/>`;

  const minimizeSvgContent = (color) => `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="0" y1="5" x2="10" y2="5" stroke="${color}" stroke-width="1"/></svg>`;
  const maximizeSvgContent = (color) => `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="0.5" y="0.5" width="9" height="9" stroke="${color}" stroke-width="1" fill="none"/></svg>`;
  const closeSvgContent = (color) => `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="color: ${color}"><line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1"/><line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1"/></svg>`;

  let currentTheme = "light";

  const setTheme = (theme) => {
    currentTheme = theme;
    const isDark = theme === "dark";

    document.body.style.background = isDark ? "rgb(40, 43, 47)" : "#f4f5f6";
    document.body.style.color = isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.85)";

    title.style.color = isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)";

    const iconColor = isDark ? "rgba(255, 255, 255, 0.55)" : "rgba(0, 0, 0, 0.55)";
    minBtn.innerHTML = minimizeSvgContent(iconColor);
    maxBtn.innerHTML = maximizeSvgContent(iconColor);
    closeBtn.innerHTML = closeSvgContent(iconColor);
  };

  document.body.style.cssText = "margin:0; padding:0; height:100vh; width:100vw; overflow:hidden; webkit-app-region:drag; font-family:'Inter',system-ui,sans-serif; user-select:none; display:flex; align-items:center; justify-content:space-between; padding-left:14px; box-sizing:border-box;";

  const left = document.createElement("div");
  left.style.cssText = "display:flex; align-items:center; gap:10px; pointer-events:none;";

  const logo = document.createElement("div");
  logo.style.display = "flex";
  logo.innerHTML = `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150">${logoPath}</svg>`;

  const title = document.createElement("div");
  title.innerText = "UniFi";
  title.style.cssText = "font-weight:500; font-size:13px; letter-spacing:0.3px;";

  left.appendChild(logo);
  left.appendChild(title);

  const controls = document.createElement("div");
  controls.style.cssText = "display:flex; height:100%; webkit-app-region:no-drag;";

  function createBtn(action, isClose = false) {
    const btn = document.createElement("div");
    btn.style.cssText = "width:46px; height:100%; display:flex; align-items:center; justify-content:center; cursor:default; transition:background-color 0.15s ease;";
    btn.onmouseenter = () => {
      const hoverBg = isClose ? "#c42b1c" : (currentTheme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)");
      btn.style.backgroundColor = hoverBg;
      if (isClose) btn.querySelector("svg").style.color = "#fff";
    };
    btn.onmouseleave = () => {
      btn.style.backgroundColor = "transparent";
      const idleColor = currentTheme === "dark" ? "rgba(255, 255, 255, 0.55)" : "rgba(0, 0, 0, 0.55)";
      if (isClose) btn.querySelector("svg").style.color = idleColor;
    };
    btn.onclick = action;
    return btn;
  }

  const minBtn = createBtn(() => ipcRenderer.send("window:minimize"));
  const maxBtn = createBtn(() => ipcRenderer.send("window:maximize"));
  const closeBtn = createBtn(() => ipcRenderer.send("window:close"), true);

  controls.appendChild(minBtn);
  controls.appendChild(maxBtn);
  controls.appendChild(closeBtn);

  document.body.appendChild(left);
  document.body.appendChild(controls);

  setTheme("light");

  ipcRenderer.on("theme-update", (event, theme) => {
    setTheme(theme);
  });
});