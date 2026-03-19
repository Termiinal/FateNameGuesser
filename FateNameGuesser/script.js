let currentPuzzle = { image: "", answers: [], hints: [] };
let hintIndex = 0;

window.addEventListener("DOMContentLoaded", () => {
    puzzleImage = document.getElementById("puzzleImage");
    hintsDiv = document.getElementById("hints");
    message = document.getElementById("message");
    inputBox = document.getElementById("answerBox");

    let saved = localStorage.getItem("puzzleData");
    if (saved) {
        currentPuzzle = JSON.parse(saved);
    } else if (typeof puzzles !== 'undefined') {
        currentPuzzle = JSON.parse(JSON.stringify(puzzles[0]));
    }
    loadPuzzle();

    inputBox.addEventListener("keypress", (e) => {
        if (e.key === "Enter") checkAnswer();
    });
});

function loadPuzzle() {
    puzzleImage.src = currentPuzzle.image || "https://via.placeholder.com/400?text=No+Image+Loaded";
    resetPuzzle();
}

function zoomImage(src) {
    const lb = document.getElementById("lightbox");
    const lbImg = document.getElementById("lightboxImg");
    lbImg.src = src;
    lb.style.display = "flex";
}

function showVictory() {
    const overlay = document.getElementById("victoryOverlay");
    const vName = document.getElementById("victoryName");
    const vImg = document.getElementById("victoryImage");
    vName.textContent = `True Name Identified: ${currentPuzzle.answers[0].toUpperCase()}`;
    vImg.src = currentPuzzle.image;
    overlay.style.display = "flex";
    updateMessage("ACCESS GRANTED", "#00ff88");
}

function showFailure() {
    const overlay = document.getElementById("failureOverlay");
    const fAnswer = document.getElementById("failureAnswer");
    const fImg = document.getElementById("failureImage");
    if (fAnswer) fAnswer.textContent = currentPuzzle.answers[0].toUpperCase();
    if (fImg) fImg.src = currentPuzzle.image;
    if (overlay) overlay.style.display = "flex";
    updateMessage("MISSION FAILED", "#ff4444");
    revealAllHints(); 
}

function checkAnswer() {
    let input = inputBox.value.toLowerCase().trim();
    let isCorrect = currentPuzzle.answers.some(a => input === a.toLowerCase().trim());

    if (isCorrect) {
        showVictory();
        revealAllHints();
    } else {
        if (hintIndex < currentPuzzle.hints.length) {
            updateMessage("Identity Mismatch. Hint Deployed.", "#ff4444");
            renderHint(currentPuzzle.hints[hintIndex]);
            hintIndex++;
        } else {
            showFailure();
        }
    }
}

function renderHint(hint) {
    const div = document.createElement("div");
    div.className = "hint"; 
    const header = document.createElement("div");
    header.className = "hint-header";
    header.innerHTML = `<span>${hint.title || "Hint"}</span> <span>▲</span>`;
    header.onclick = () => {
        div.classList.toggle("collapsed");
        header.querySelector('span:last-child').textContent = div.classList.contains("collapsed") ? "▼" : "▲";
    };

    const content = document.createElement("div");
    content.className = "hint-content";
    
    if (hint.type === "text") {
        content.innerHTML = `<div>${hint.content}</div>`;
    } else if (hint.type === "image") {
        content.innerHTML = `<img src="${hint.content}" style="width:100%; border-radius:8px; cursor:zoom-in;" onclick="zoomImage('${hint.content}')">`;
    } else if (hint.type === "video") {
        let id = "";
        if (hint.content.includes("v=")) {
            id = hint.content.split("v=")[1].split("&")[0];
        } else if (hint.content.includes("youtu.be/")) {
            id = hint.content.split("youtu.be/")[1].split("?")[0];
        }
        
        // Force the origin to help YouTube validate the domain
        let host = window.location.hostname === "" ? "localhost" : window.location.origin;

        content.innerHTML = `
            <iframe 
                width="100%" height="200" 
                src="https://www.youtube.com/embed/${id}?enablejsapi=1&origin=${host}" 
                frameborder="0" 
                allow="autoplay; encrypted-media" 
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen>
            </iframe>
            <div style="margin-top:8px;">
                <a href="https://www.youtube.com/watch?v=${id}" target="_blank" style="color:var(--primary); font-size:0.8rem; text-decoration:none;">
                    ↗ Open Video in New Tab
                </a>
            </div>`;
    }

    div.appendChild(header);
    div.appendChild(content);
    hintsDiv.appendChild(div);
}

// EDITOR & FILE HANDLING (Keep your existing functions for these)
function toggleEditor() {
    const ui = document.getElementById("editorUI");
    if (ui.style.display === "none") {
        ui.style.display = "block";
        document.getElementById("editImg").value = currentPuzzle.image;
        document.getElementById("editAnswers").value = currentPuzzle.answers.join(", ");
        refreshHintManager();
    } else { ui.style.display = "none"; }
}

function refreshHintManager() {
    const list = document.getElementById("hintManagerList");
    if (!list) return;
    list.innerHTML = "";
    currentPuzzle.hints.forEach((hint, index) => {
        const row = document.createElement("div");
        row.className = "hint-edit-row";
        row.innerHTML = `
            <input type="text" placeholder="Title" value="${hint.title}" onchange="updateHint(${index}, 'title', this.value)">
            <select onchange="updateHint(${index}, 'type', this.value)">
                <option value="text" ${hint.type === 'text' ? 'selected' : ''}>Text</option>
                <option value="image" ${hint.type === 'image' ? 'selected' : ''}>Image URL</option>
                <option value="video" ${hint.type === 'video' ? 'selected' : ''}>Video URL</option>
            </select>
            <textarea style="width:100%; height:60px; margin-top:5px;" onchange="updateHint(${index}, 'content', this.value)">${hint.content}</textarea>
            <button style="background:#ff4444; color:white; width:100%; margin-top:5px;" onclick="removeHint(${index})">Delete Hint</button>
        `;
        list.appendChild(row);
    });
}

function updateHint(i, f, v) { currentPuzzle.hints[i][f] = v; }
function removeHint(i) { currentPuzzle.hints.splice(i, 1); refreshHintManager(); }
function addNewHintRow() { currentPuzzle.hints.push({ type: "text", title: "New Hint", content: "" }); refreshHintManager(); }

function applyEditorChanges() {
    currentPuzzle.image = document.getElementById("editImg").value;
    currentPuzzle.answers = document.getElementById("editAnswers").value.split(",").map(s => s.trim());
    localStorage.setItem("puzzleData", JSON.stringify(currentPuzzle));
    loadPuzzle();
    toggleEditor();
}

function exportPuzzleFile() {
    const blob = new Blob([JSON.stringify(currentPuzzle, null, 2)], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "servant_puzzle.json";
    a.click();
}

function importPuzzleFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
        const reader = new FileReader();
        reader.onload = ev => {
            currentPuzzle = JSON.parse(ev.target.result);
            localStorage.setItem("puzzleData", JSON.stringify(currentPuzzle));
            loadPuzzle();
        };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
}

function updateMessage(txt, color) { message.textContent = txt; message.style.color = color; }
function resetPuzzle() { hintIndex = 0; hintsDiv.innerHTML = ""; updateMessage("Identify the Heroic Spirit", "var(--text)"); inputBox.value = ""; }
function revealAllHints() { while (hintIndex < currentPuzzle.hints.length) { renderHint(currentPuzzle.hints[hintIndex]); hintIndex++; } }