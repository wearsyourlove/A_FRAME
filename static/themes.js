// 🔹 Theme Presets Using CSS Variables for Better Performance
const themes = {
    dark: {
        "--background": "#000",
        "--text": "#0f0",
        "--border": "#444"
    },
    light: {
        "--background": "#fff",
        "--text": "#222",
        "--border": "#ddd"
    },
    cyberpunk: {
        "--background": "#100c2a",
        "--text": "#ff00ff",
        "--border": "#00ffff"
    }
};

// 🔹 Apply Theme Using CSS Variables
function applyTheme(theme) {
    if (themes[theme]) {
        Object.keys(themes[theme]).forEach(property => {
            document.documentElement.style.setProperty(property, themes[theme][property]);
        });
        console.log(`✅ Theme switched to: ${theme}`);
    } else {
        console.log(`⚠️ Unknown theme: "${theme}". Available themes: ${Object.keys(themes).join(", ")}`);
    }
}

// 🔹 Listen for Theme Change Commands
document.getElementById("command-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const command = event.target.value.trim();
        if (command.startsWith("theme ")) {
            const theme = command.split(" ")[1];
            applyTheme(theme);
        }
    }
});

// 🔹 Set Default Theme on Page Load
document.addEventListener("DOMContentLoaded", () => {
    applyTheme("dark");  // Change this default if needed
});
