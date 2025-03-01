document.addEventListener("DOMContentLoaded", function() {
    const inputField = document.getElementById("command-input");
    const outputDiv = document.getElementById("output");

    inputField.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            const command = inputField.value.trim();
            processCommand(command);
            inputField.value = ""; // Clear input
        }
    });

    function processCommand(command) {
        let response = "";

        if (command === "help") {
            response = "Available commands: search, list, theme, clear";
        } else if (command.startsWith("search ")) {
            const query = command.replace("search ", "");
            fetchResults(query);
            return;
        } else if (command === "clear") {
            outputDiv.innerHTML = "";
            return;
        } else {
            response = "Unknown command. Type 'help' for a list.";
        }

        outputDiv.innerHTML += `<div>> ${command}</div>`;
        outputDiv.innerHTML += `<div>${response}</div>`;
    }

    function fetchResults(query) {
        fetch(`/api/search?query=${query}`)
            .then(response => response.json())
            .then(data => {
                outputDiv.innerHTML += `<div>Results for "${query}":</div>`;
                data.results.forEach(result => {
                    outputDiv.innerHTML += `<div>- ${result}</div>`;
                });
            })
            .catch(error => {
                outputDiv.innerHTML += `<div>Error fetching results.</div>`;
            });
    }
});
