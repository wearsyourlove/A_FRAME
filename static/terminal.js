document.addEventListener("DOMContentLoaded", () => {
    const inputField = document.getElementById("command-input");

    inputField.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") {
            const command = inputField.value.trim();
            inputField.value = "";
            
            // Simulated command system
            if (command.startsWith("search ")) {
                let query = command.replace("search ", "");
                await searchTopic(query);
            } else {
                alert("Unknown command.");
            }
        }
    });
});

