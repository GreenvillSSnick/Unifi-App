const { ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
    const getTheme = () => {
        const html = document.documentElement;
        const body = document.body;
        const root = document.getElementById("root");

        const htmlClasses = Array.from(html.classList);
        const bodyClasses = Array.from(body.classList);

        if (htmlClasses.includes("dark") || bodyClasses.includes("dark")) {
            return "dark";
        }

        let bgColor = window.getComputedStyle(body).backgroundColor;
        if (!bgColor || bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") {
            if (root) {
                bgColor = window.getComputedStyle(root).backgroundColor;
            }
        }

        const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);

            const brightness = (r + g + b) / 3;

            console.log(`[UniFi] Theme Debug - BG: ${bgColor}, Brightness: ${brightness}, Classes: ${htmlClasses.join(",")}`);

            if (brightness < 60) {
                return "dark";
            }
        }

        return "light";
    };

    const syncTheme = () => {
        const theme = getTheme();
        ipcRenderer.send("unifi:theme-change", theme);
    };

    syncTheme();
    setTimeout(syncTheme, 1000);
    setTimeout(syncTheme, 3000);
    setTimeout(syncTheme, 5000);

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    const rootObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length || mutation.type === "attributes") {
                syncTheme();
                break;
            }
        }
    });
    rootObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
});
