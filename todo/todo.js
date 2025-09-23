const express = require("express");
const app = express();

app.use(express.json());

let tasks = [];

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/tasks", (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: "Title is required" });

  const newTask = { id: Date.now().toString(), title, description: description || "" };
  tasks.push(newTask);
  res.json({ message: "Task created", task: newTask });
});
app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});


app.get("/api/tasks/:id", (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});


app.put("/api/tasks/:id", (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  task.title = req.body.title || task.title;
  task.description = req.body.description || task.description;

  res.json({ message: "Task updated", task });
});


app.delete("/api/tasks/:id", (req, res) => {
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Task not found" });

  tasks.splice(index, 1);
  res.json({ message: "Task deleted" });
});

app.get("/", (req, res) => {
  res.send(" Todo Task API is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



