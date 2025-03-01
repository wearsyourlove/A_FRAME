async function searchTopic(query) {
    const response = await fetch(`/ai/hybrid_search/?query=${query}`);
    const data = await response.json();
    
    renderResults(data);
}

function renderResults(data) {
    const output = document.getElementById("output");
    output.innerHTML = "";
    
    data.faiss_results.forEach(result => {
        const div = document.createElement("div");
        div.classList.add("hover-box");
        div.innerHTML = result;
        output.appendChild(div);
    });
}

