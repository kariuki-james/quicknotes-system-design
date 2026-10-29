const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.getElementById("load-btn");
const statusEl = document.getElementById("status");
const notesList = document.getElementById("notes-list");

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, data };
}

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type ? `status status--${type}` : "status";
}

function showEmptyState() {
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = "No notes yet.";
  notesList.appendChild(li);
}

function addNoteToList(note) {
  const empty = notesList.querySelector(".empty");
  if (empty) empty.remove();

  const li = document.createElement("li");
  li.dataset.id = note.id;

  const title = document.createElement("h2");
  title.textContent = note.title;

  const body = document.createElement("p");
  body.textContent = note.body;

  li.append(title, body);
  notesList.appendChild(li);
}

async function loadNotes() {
  loadBtn.disabled = true;
  setStatus("Loading notes...", "info");

  try {
    const { data: notes } = await request(`${API_URL}?_limit=10`);
    notesList.innerHTML = "";

    if (notes.length === 0) {
      showEmptyState();
    } else {
      notes.forEach((note) => addNoteToList(note));
    }

    setStatus(`Loaded ${notes.length} notes from the server.`, "success");
  } catch (error) {
    setStatus(`Error: could not load notes (${error.message}).`, "error");
  } finally {
    loadBtn.disabled = false;
  }
}

loadBtn.addEventListener("click", loadNotes);
