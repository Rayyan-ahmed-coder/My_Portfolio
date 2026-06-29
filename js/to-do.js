import { CustomCursor } from "./main.js";

const storageKey = 'todo-tracker-v12.6';

const taskInput = document.getElementById('taskInput');
const addButton = document.getElementById('addButton');
const todoList = document.getElementById('todoList');
const countLabel = document.getElementById('countLabel');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedButton = document.getElementById('clearCompleted');
const clearAllButton = document.getElementById('clearAll');

let tasks = JSON.parse(localStorage.getItem(storageKey) || '[]');
let activeFilter = 'all';

function saveTasks() {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function formatTaskCount(count) {
    if (count === 0) return 'No tasks yet';
    if (count === 1) return '1 task';
    return `${count} tasks`;
}

function updateCount() {
    const visible = getFilteredTasks();
    countLabel.textContent = formatTaskCount(visible.length);
}

function getFilteredTasks() {
    if (activeFilter === 'active') {
        return tasks.filter(task => !task.completed);
    }
    if (activeFilter === 'completed') {
        return tasks.filter(task => task.completed);
    }
    return tasks;
}

function createTaskElement(task) {
    const listItem = document.createElement('li');
    listItem.className = `todo-item${task.completed ? ' completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => {
        task.completed = checkbox.checked;
        saveTasks();
        renderTasks();
    });

    const label = document.createElement('label');
    label.textContent = task.text;
    label.htmlFor = `task-${task.id}`;

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'checkbox';
    hiddenInput.id = `task-${task.id}`;
    hiddenInput.style.display = 'none';

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.type = 'button';
    deleteButton.textContent = '✕';
    deleteButton.addEventListener('click', () => {
        tasks = tasks.filter(item => item.id !== task.id);
        saveTasks();
        renderTasks();
    });

    listItem.appendChild(checkbox);
    listItem.appendChild(label);
    listItem.appendChild(deleteButton);
    listItem.appendChild(hiddenInput);
    return listItem;
}

function renderTasks() {
    const filtered = getFilteredTasks();
    todoList.innerHTML = '';

    if (filtered.length === 0) {
        const emptyState = document.createElement('li');
        emptyState.className = 'todo-item';
        emptyState.style.justifyContent = 'center';
        emptyState.textContent = 'No matching tasks yet. Add something Awesome.';
        todoList.appendChild(emptyState);
    } else {
        filtered.forEach(task => {
            todoList.appendChild(createTaskElement(task));
        });
    }

    updateCount();
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    tasks.push({
        id: Date.now(),
        text,
        completed: false,
    });

    taskInput.value = '';
    saveTasks();
    renderTasks();
}

// Instantiate the class
new CustomCursor();

addButton.addEventListener('click', addTask);

taskInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        addTask();
    }
});

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        activeFilter = button.dataset.filter;
        renderTasks();
    });
});

clearCompletedButton.addEventListener('click', () => {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
});

clearAllButton.addEventListener('click', () => {
    tasks = [];
    saveTasks();
    renderTasks();
});


document.addEventListener(`DOMContentLoaded`, () => {
    new CustomCursor();
    renderTasks();
})