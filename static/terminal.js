document.addEventListener("DOMContentLoaded", function () {
    const inputField = document.getElementById("command-input");
    const outputDiv = document.getElementById("output");
    const history = [];
    let historyIndex = -1;
    let searchCache = {}; // 🔹 Caches previous search results

    inputField.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            const command = inputField.value.trim();
            if (command) {
                history.push(command);
                historyIndex = history.length; // Reset history index
                processCommand(command);
                inputField.value = ""; // Clear input
            }
        } else if (event.key === "ArrowUp") {
            if (historyIndex > 0) {
                historyIndex--;
                inputField.value = history[historyIndex];
            }
        } else if (event.key === "ArrowDown") {
            if (historyIndex < history.length - 1) {
                historyIndex++;
                inputField.value = history[historyIndex];
            } else {
                inputField.value = "";
            }
        }
    });

    function processCommand(command) {
        let response = "";

        outputDiv.innerHTML += `<div class="command-line">> ${command}</div>`;

        const parts = command.split(" ");
        const cmd = parts[0].toLowerCase();

        switch (cmd) {
            case "help":
                response = `
                    <strong>Available commands:</strong><br>
                    <span class="cmd">search [query]</span> - Search topics<br>
                    <span class="cmd">list</span> - List available topics<br>
                    <span class="cmd">theme [light/dark]</span> - Change theme<br>
                    <span class="cmd">clear</span> - Clear terminal`;
                break;

            case "search":
                const query = parts.slice(1).join(" ");
                if (query.length > 0) {
                    fetchResults(query);
                } else {
                    response = "⚠️ Please provide a search term.";
                }
                return;

            case "list":
                fetchTopics();
                return;

            case "theme":
                const theme = parts[1];
                if (theme === "light" || theme === "dark") {
                    document.body.className = `theme-${theme}`;
                    localStorage.setItem("theme", theme);
                    response = `🎨 Theme set to ${theme}`;
                } else {
                    response = "⚠️ Usage: theme [light/dark]";
                }
                break;

            case "clear":
                outputDiv.innerHTML = "";
                return;

            default:
                response = "❓ Unknown command. Type '<span class='cmd'>help</span>' for a list.";
        }

        outputDiv.innerHTML += `<div class="command-response">${response}</div>`;
    }

    function fetchResults(query) {
        if (searchCache[query]) {
            displayResults(query, searchCache[query]);
            return;
        }

        fetch(`/api/search?query=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                searchCache[query] = data.results; // Cache results
                displayResults(query, data.results);
            })
            .catch(error => {
                outputDiv.innerHTML += `<div class="error">⚠️ Error fetching results.</div>`;
            });
    }

    function fetchTopics() {
        fetch("/api/topics")
            .then(response => response.json())
            .then(data => {
                outputDiv.innerHTML += `<div class="command-response">📚 Available Topics:</div>`;
                data.forEach(topic => {
                    outputDiv.innerHTML += `<div class="topic-list-item">- ${topic}</div>`;
                });
            })
            .catch(error => {
                outputDiv.innerHTML += `<div class="error">⚠️ Error fetching topics.</div>`;
            });
    }

    function displayResults(query, results) {
        outputDiv.innerHTML += `<div class="command-response">🔎 Results for "<strong>${query}</strong>":</div>`;
        if (results.length === 0) {
            outputDiv.innerHTML += `<div class="no-results">🚫 No results found.</div>`;
        } else {
            results.forEach(result => {
                outputDiv.innerHTML += `<div class="search-result">- ${result}</div>`;
            });
        }
    }

    // Load saved theme on startup
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.body.className = `theme-${savedTheme}`;
});
