document.addEventListener("DOMContentLoaded", function () {
    const outputDiv = document.getElementById("output");
    const inputField = document.getElementById("command-input");

    let searchCache = {}; // 🔹 Cache to store search results

    async function searchTopic(query) {
        if (!query.trim()) {
            displayMessage("⚠️ Please enter a search term.");
            return;
        }

        if (searchCache[query]) {
            renderResults(query, searchCache[query]);
            return;
        }

        try {
            const response = await fetch(`/ai/hybrid_search/?query=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error("Failed to fetch results.");

            const data = await response.json();
            searchCache[query] = data;
            renderResults(query, data);
        } catch (error) {
            displayMessage("❌ Error fetching search results.");
        }
    }

    async function listTopics() {
        try {
            const response = await fetch("/api/topics");
            if (!response.ok) throw new Error("Failed to fetch topics.");

            const data = await response.json();
            renderTopicList(data);
        } catch (error) {
            displayMessage("❌ Error fetching topics.");
        }
    }

    async function fetchTopicDetails(topicName) {
        try {
            const response = await fetch(`/api/topics/${encodeURIComponent(topicName)}`);
            if (!response.ok) throw new Error("Failed to fetch topic details.");

            const data = await response.json();
            displayTopicDetails(data);
        } catch (error) {
            displayMessage("❌ Error fetching topic details.");
        }
    }

    function renderResults(query, data) {
        outputDiv.innerHTML = `<div class="command-response">🔎 Results for "<strong>${query}</strong>":</div>`;

        if (data.faiss_results.length === 0) {
            outputDiv.innerHTML += `<div class="no-results">🚫 No results found.</div>`;
            return;
        }

        const resultContainer = document.createElement("div");
        resultContainer.classList.add("result-container");

        data.faiss_results.forEach(result => {
            const div = document.createElement("div");
            div.classList.add("hover-box", "search-result");
            div.textContent = result;
            div.onclick = () => fetchTopicDetails(result);
            resultContainer.appendChild(div);
        });

        outputDiv.appendChild(resultContainer);
    }

    function renderTopicList(topics) {
        outputDiv.innerHTML = `<div class="command-response">📚 Available Topics:</div>`;

        const topicContainer = document.createElement("div");
        topicContainer.classList.add("topic-container");

        topics.forEach(topic => {
            const div = document.createElement("div");
            div.classList.add("topic-item");
            div.textContent = topic;
            div.onclick = () => fetchTopicDetails(topic);
            topicContainer.appendChild(div);
        });

        outputDiv.appendChild(topicContainer);
    }

    function displayTopicDetails(topicData) {
        outputDiv.innerHTML = `<div class="command-response">📖 Topic: <strong>${topicData.topic.name}</strong></div>`;

        if (topicData.topic.description) {
            outputDiv.innerHTML += `<div class="topic-description">${topicData.topic.description}</div>`;
        }

        if (topicData.relationships.length > 0) {
            outputDiv.innerHTML += `<div class="command-response">🔗 Related Topics:</div>`;
            topicData.relationships.forEach(rel => {
                outputDiv.innerHTML += `<div class="relationship">➡ ${rel.name} (distance: ${rel.distance})</div>`;
            });
        } else {
            outputDiv.innerHTML += `<div class="no-results">No relationships found.</div>`;
        }
    }

    function displayMessage(message) {
        outputDiv.innerHTML += `<div class="message">${message}</div>`;
    }

    // Expose functions for terminal.js
    window.searchTopic = searchTopic;
    window.listTopics = listTopics;
});
