// === Simple Productivity App ===

// DOM elements
const textInput = document.getElementById("taskText");
const deadlineInput = document.getElementById("taskDeadline");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const searchBox = document.getElementById("searchBox");
const filter = document.getElementById("filter");

/* taks variable retreive tasks form local storage in the
form of strings and convert it into array of objects to display*/

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

//  THE FOLLOWINGS ARE THE MAIN FUNCTIONS OF THIS TODO APP

// this code save tasks into localStorage of our browser 
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

/*Render  or draw tasks all tasks on the screen.
it removes the previous tasks 
before rendering the updated tasks to the screen
not to display overlapped tasks after updation of time*/

function renderTasks() {
  taskList.innerHTML = "";
  const now = new Date();

  /*to search and filter tasks it checks if text of task
  matches with the text or in the search box*/
  let visibleTasks = tasks.filter(t => {
    const matchSearch = t.text.toLowerCase().includes(searchBox.value.toLowerCase());
    /* checks if the task deadline exist, if it is before the current time
    and weather the task is completed or not.
    */ 
    const overdue = t.deadline && new Date(t.deadline) < now && !t.completed;
    /* check the search value with the 
    status of tasks to filter the tasks required */
    if (filter.value === "active" && t.completed) return false;
    if (filter.value === "completed" && !t.completed) return false;
    if (filter.value === "overdue" && !overdue) return false;
    return matchSearch;
  });

  // create each task item
  visibleTasks.forEach((t, i) => {
    const li = document.createElement("li");
    li.className = t.completed ? "completed" : "";
    if (t.deadline && new Date(t.deadline) < now && !t.completed) li.classList.add("overdue");

    li.innerHTML = `
      <div>
        <input type="checkbox" ${t.completed ? "checked" : ""} data-index="${i}">
        <span>${t.text}</span>
        ${t.deadline ? `<div class="deadline">Due: ${new Date(t.deadline).toLocaleString()}</div>` : ""}
      </div>
      <div>
        <button class="edit" data-index="${i}">✏️</button>
        <button class="delete" data-index="${i}">🗑</button>
      </div>
    `;
    /* add the list item as a final child to the unordered list */
    taskList.appendChild(li);
  });
}

// Add new task
addBtn.onclick = () => {
  const text = textInput.value.trim();
  if (!text) return alert("To add to the list, enter a task first!");
  const deadline = deadlineInput.value ? new Date(deadlineInput.value).toISOString() : null;

  /* push the task with its time and date to the tasklist. 
  it is initially incompleted and not notified */
  tasks.push({ text, completed: false, deadline, notified: false });

  /* clear the feilds of add task and deadline picking after one task pushed */
  textInput.value = "";
  deadlineInput.value = "";
  /* save the added task to the local storage and render it on the 
  screen */
  saveTasks();
  renderTasks();
};

// Toggle complete / edit / delete
taskList.onclick = (e) => {
  const index = e.target.dataset.index;
  if (e.target.type === "checkbox") {
    tasks[index].completed = e.target.checked;
  }
  if (e.target.classList.contains("delete")) {
    if (confirm("Delete this task?")) tasks.splice(index, 1);
  }
  if (e.target.classList.contains("edit")) {
    /* edit task description and deadline via UI elemennt */
    const currentText = tasks[index].text;
    const currentDeadline = tasks[index].deadline ? new Date(tasks[index].deadline).toLocaleString() : "";

    // Ask user for new text
    const newText = prompt("Edit task text:", currentText);
    if (newText !== null && newText.trim() !== "") {
      tasks[index].text = newText.trim();
    }

    // Ask user for new deadline
    const newDeadline = prompt("Edit deadline (YYYY-MM-DD HH:MM):", currentDeadline);
    if (newDeadline !== null && newDeadline.trim() !== "") {
      // Try to parse the new deadline
      const parsed = new Date(newDeadline);
      if (!isNaN(parsed)) {
        tasks[index].deadline = parsed.toISOString();
      } else {
        alert("Invalid date format. Deadline not changed.");
      }
    }

    saveTasks();
    renderTasks();
  }
  saveTasks();
  renderTasks();
};

// Filter / search changes
filter.onchange = renderTasks;
searchBox.oninput = renderTasks;

// --- FETCH initial tasks if empty ---
if (tasks.length === 0) {
  fetch("https://jsonplaceholder.typicode.com/todos?_limit=10")
    .then(res => res.json())
    .then(data => {
      tasks = data.map(d => ({ text: d.title, completed: d.completed, deadline: null, notified: false }));
      saveTasks();
      renderTasks();
    })
    .catch(err => console.error("Failed to fetch initial tasks", err));
}

/* --- Select All / Bulk Actions ---
   this checkbox toggles completion status of all visible tasks */
const selectAllBox = document.createElement("input");
selectAllBox.type = "checkbox";
selectAllBox.id = "selectAll";
selectAllBox.title = "Select All tasks";
document.querySelector(".controls").appendChild(selectAllBox);

selectAllBox.onchange = () => {
  const now = new Date();
  let visibleTasks = tasks.filter(t => {
    const overdue = t.deadline && new Date(t.deadline) < now && !t.completed;
    if (filter.value === "active" && t.completed) return false;
    if (filter.value === "completed" && !t.completed) return false;
    if (filter.value === "overdue" && !overdue) return false;
    return true;
  });
  visibleTasks.forEach(t => t.completed = selectAllBox.checked);
  saveTasks();
  renderTasks();
};

// --- NOTIFICATIONS ---
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

// Check for upcoming or overdue tasks every minute
setInterval(() => {
  const now = new Date();
  tasks.forEach(t => {
    if (!t.deadline || t.completed || t.notified) return;
    const diff = new Date(t.deadline) - now;
    if (diff <= 15 * 60 * 1000) { // due in 15 minutes or less
      if (Notification.permission === "granted") {
        new Notification("Task Reminder", { body: `${t.text} is due soon!` });
      }
      t.notified = true;
      saveTasks();
    }
  });
  renderTasks();
}, 60000); // every 60 seconds

// Initial render
renderTasks();
