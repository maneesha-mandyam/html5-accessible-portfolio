
"use strict";

const STORAGE_KEY = "taskflow.tasks.v1";

const form = document.getElementById("taskForm");
const input = document.getElementById("taskInput");
const list = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const message = document.getElementById("taskMessage");

const totalCount = document.getElementById("totalCount");
const activeCount = document.getElementById("activeCount");
const completedCount = document.getElementById("completedCount");
const remainingText = document.getElementById("remainingText");

const clearCompleted = document.getElementById("clearCompleted");
const deleteAll = document.getElementById("deleteAll");
const filterButtons = document.querySelectorAll("[data-filter]");

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.text === "string" &&
      typeof task.completed === "boolean"
    );
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch {
    showMessage("Unable to save tasks in this browser.", true);
    return false;
  }
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#b33d59" : "#159b70";
}

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Date.now().toString(36) +
    Math.random().toString(36).slice(2);
}

function addTask(text) {
  tasks.unshift({
    id: createId(),
    text,
    completed: false
  });

  saveTasks();
  render();
  showMessage("Task added successfully.");
}

function toggleTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();
  render();

  showMessage(
    task.completed ? "Task completed!" : "Task marked active."
  );
}

function editTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  const updated = window.prompt("Edit your task:", task.text);

  if (updated === null) return;

  const text = updated.trim();

  if (!text) {
    showMessage("Task cannot be empty.", true);
    return;
  }

  task.text = text.slice(0, 150);
  saveTasks();
  render();
  showMessage("Task updated successfully.");
}

function deleteTask(id) {
  tasks = tasks.filter(item => item.id !== id);
  saveTasks();
  render();
  showMessage("Task deleted.");
}

function getVisibleTasks() {
  if (currentFilter === "active") {
    return tasks.filter(task => !task.completed);
  }

  if (currentFilter === "completed") {
    return tasks.filter(task => task.completed);
  }

  return tasks;
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = "task-item";
  if (task.completed) item.classList.add("completed");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", "Complete " + task.text);
  checkbox.addEventListener("change", () => toggleTask(task.id));

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.textContent = "Edit";
  editButton.setAttribute("aria-label", "Edit " + task.text);
  editButton.addEventListener("click", () => editTask(task.id));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", "Delete " + task.text);
  deleteButton.addEventListener("click", () => deleteTask(task.id));

  actions.append(editButton, deleteButton);
  item.append(checkbox, text, actions);

  return item;
}

function render() {
  const visibleTasks = getVisibleTasks();
  const active = tasks.filter(task => !task.completed).length;
  const completed = tasks.length - active;

  totalCount.textContent = tasks.length;
  activeCount.textContent = active;
  completedCount.textContent = completed;

  remainingText.textContent =
    active + (active === 1 ? " task remaining" : " tasks remaining");

  list.replaceChildren();

  visibleTasks.forEach(task => {
    list.appendChild(createTaskElement(task));
  });

  emptyState.hidden = visibleTasks.length !== 0;

  if (tasks.length === 0) {
    emptyState.querySelector("h3").textContent = "No tasks yet";
    emptyState.querySelector("p").textContent =
      "Add a task above to get started.";
  } else if (visibleTasks.length === 0) {
    emptyState.querySelector("h3").textContent = "No matching tasks";
    emptyState.querySelector("p").textContent =
      "Try another filter to see your tasks.";
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const text = input.value.trim();

  if (!text) {
    showMessage("Please enter a task.", true);
    input.focus();
    return;
  }

  addTask(text.slice(0, 150));
  input.value = "";
  input.focus();
});

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach(filterButton => {
      const selected = filterButton === button;
      filterButton.classList.toggle("active", selected);
      filterButton.setAttribute("aria-pressed", String(selected));
    });

    render();
    showMessage("Showing " + currentFilter + " tasks.");
  });
});

clearCompleted.addEventListener("click", () => {
  const before = tasks.length;
  tasks = tasks.filter(task => !task.completed);

  if (tasks.length === before) {
    showMessage("There are no completed tasks to clear.");
    return;
  }

  saveTasks();
  render();
  showMessage("Completed tasks cleared.");
});

deleteAll.addEventListener("click", () => {
  if (tasks.length === 0) {
    showMessage("There are no tasks to delete.");
    return;
  }

  if (!window.confirm("Delete all tasks? This cannot be undone.")) {
    return;
  }

  tasks = [];
  saveTasks();
  render();
  showMessage("All tasks deleted.");
});

render();
