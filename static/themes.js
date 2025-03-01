const themes = {
    dark: {
        background: "#000",
        text: "#0f0",
        border: "#444"
    },
    light: {
        background: "#fff",
        text: "#222",
        border: "#ddd"
    }
};

function applyTheme(theme) {
    document.body.style.background = themes[theme].background;
    document.body.style.color = themes[theme].text;
}

document.getElementById("command-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const command = event.target.value.trim();
        if (command === "theme dark") applyTheme("dark");
        if (command === "theme light") applyTheme("light");
    }
});
