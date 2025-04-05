import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Paper,
  AppBar,
  Toolbar,
} from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import axios from "axios";

// Get the backend URL from the current window location
// This makes it work regardless of which port it's running on
const getBackendUrl = () => {
  // Extract current hostname and port
  const { hostname, port: frontendPortStr } = window.location;
  const frontendPort = parseInt(frontendPortStr, 10);

  // If we can't determine the port, default to the session manager's predefined URL structure
  // This requires that the frontend URLs from the session manager include the port
  if (isNaN(frontendPort)) {
    // Try to extract it from pathname or use default
    const pathParts = window.location.pathname.split("/");
    if (pathParts.length > 1 && !isNaN(parseInt(pathParts[1], 10))) {
      return `http://${hostname}:${parseInt(pathParts[1], 10) + 1}/api`;
    }

    // If all else fails, fallback to default port 3000
    console.warn(
      "Could not determine backend port, falling back to default port 3000",
    );
    return `http://${hostname}:3000/api`;
  }

  // The backend port is always frontend port + 1 based on how our session manager allocates ports
  const backendPort = frontendPort + 1;

  return `http://${hostname}:${backendPort}/api`;
};

const API_URL = getBackendUrl();

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({ title: "", description: "" });
  const [editingTodo, setEditingTodo] = useState(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      console.log("Fetching todos from:", API_URL + "/todos");
      const response = await axios.get(`${API_URL}/todos`);
      setTodos(response.data);
    } catch (error) {
      console.error("Error fetching todos:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTodo) {
        await axios.put(`${API_URL}/todos/${editingTodo.id}`, {
          ...newTodo,
          completed: editingTodo.completed,
        });
        setEditingTodo(null);
      } else {
        await axios.post(`${API_URL}/todos`, newTodo);
      }
      setNewTodo({ title: "", description: "" });
      fetchTodos();
    } catch (error) {
      console.error("Error saving todo:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/todos/${id}`);
      fetchTodos();
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const handleToggle = async (todo) => {
    try {
      await axios.put(`${API_URL}/todos/${todo.id}`, {
        ...todo,
        completed: !todo.completed,
      });
      fetchTodos();
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setNewTodo({
      title: todo.title,
      description: todo.description || "",
    });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Todo App
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Title"
              value={newTodo.title}
              onChange={(e) =>
                setNewTodo({ ...newTodo, title: e.target.value })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={newTodo.description}
              onChange={(e) =>
                setNewTodo({ ...newTodo, description: e.target.value })
              }
              margin="normal"
              multiline
              rows={2}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              {editingTodo ? "Update Todo" : "Add Todo"}
            </Button>
            {editingTodo && (
              <Button
                variant="outlined"
                color="secondary"
                sx={{ mt: 2, ml: 2 }}
                onClick={() => {
                  setEditingTodo(null);
                  setNewTodo({ title: "", description: "" });
                }}
              >
                Cancel
              </Button>
            )}
          </form>
        </Paper>

        <List>
          {todos.map((todo) => (
            <Paper
              key={todo.id}
              elevation={2}
              sx={{ mb: 1, bgcolor: todo.completed ? "#f5f5f5" : "white" }}
            >
              <ListItem>
                <Checkbox
                  edge="start"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo)}
                />
                <ListItemText
                  primary={todo.title}
                  secondary={todo.description}
                  sx={{
                    textDecoration: todo.completed ? "line-through" : "none",
                    color: todo.completed ? "text.secondary" : "text.primary",
                  }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEdit(todo)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(todo.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </Paper>
          ))}
        </List>
      </Container>
    </Box>
  );
}

export default App;
