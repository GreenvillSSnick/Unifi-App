import { app, BrowserWindow, BrowserView, session, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PARTITION = "persist:unifi";
const TOPBAR_HEIGHT = 40;

let win: BrowserWindow | null = null;

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

async function createWindow() {
  const ses = session.fromPartition(PARTITION);
  ses.setUserAgent(CHROME_UA);

  win = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    backgroundColor: "#0f1720",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: PARTITION,
    },
  });

  const [winWidth, winHeight] = win.getSize();

  const topBarView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "..", "src", "topbar-preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.addBrowserView(topBarView);
  topBarView.setBounds({ x: 0, y: 0, width: winWidth, height: TOPBAR_HEIGHT });
  topBarView.webContents.loadURL("data:text/html;charset=utf-8,%3Chtml%3E%3Cbody%3E%3C%2Fbody%3E%3C%2Fhtml%3E");

  const uniFiView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "..", "src", "unifi-preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: PARTITION,
    },
  });
  win.addBrowserView(uniFiView);
  uniFiView.setBounds({ x: 0, y: TOPBAR_HEIGHT, width: winWidth, height: winHeight - TOPBAR_HEIGHT });

  let isHtmlFullscreen = false;

  function updateBounds() {
    if (!win) return;
    const { width, height } = win.getContentBounds();
    if (isHtmlFullscreen) {
      topBarView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      uniFiView.setBounds({ x: 0, y: 0, width, height });
    } else {
      topBarView.setBounds({ x: 0, y: 0, width, height: TOPBAR_HEIGHT });
      uniFiView.setBounds({ x: 0, y: TOPBAR_HEIGHT, width, height: height - TOPBAR_HEIGHT });
    }
  }

  win.on("resize", updateBounds);
  win.on("maximize", updateBounds);
  win.on("unmaximize", updateBounds);

  uniFiView.webContents.on("enter-html-full-screen", () => {
    isHtmlFullscreen = true;
    win?.setFullScreen(true);
    updateBounds();
  });

  uniFiView.webContents.on("leave-html-full-screen", () => {
    isHtmlFullscreen = false;
    win?.setFullScreen(false);
    updateBounds();
  });

  await uniFiView.webContents.loadURL("https://unifi.ui.com");

  ipcMain.on("unifi:theme-change", (event, theme) => {
    if (!topBarView.webContents.isDestroyed()) {
      topBarView.webContents.send("theme-update", theme);
    }
  });

  win.on("closed", () => {
    win = null;
    ipcMain.removeAllListeners("unifi:theme-change");
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on("window:minimize", () => win?.minimize());
ipcMain.on("window:maximize", () => {
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.on("window:close", () => win?.close());