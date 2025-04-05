import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Divider,
  AppBar,
  Toolbar,
  Alert,
  Snackbar,
  Paper,
} from "@mui/material";
import {
  Add as AddIcon,
  DeleteSweep as DeleteAllIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import SessionCard from "./components/SessionCard";
import * as api from "./services/api";

function App() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listSessions();
      setSessions(data);
    } catch (err) {
      setError("Failed to fetch sessions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSession = async () => {
    try {
      setLoading(true);
      const newSession = await api.createSession();
      setSessions((prev) => [...prev, newSession]);
      setSnackbar({
        open: true,
        message: "New session created successfully!",
        severity: "success",
      });
    } catch (err) {
      setError("Failed to create session");
      setSnackbar({
        open: true,
        message: "Failed to create session",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      setLoading(true);
      await api.deleteSession(sessionId);
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      setSnackbar({
        open: true,
        message: "Session deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      setError("Failed to delete session");
      setSnackbar({
        open: true,
        message: "Failed to delete session",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllSessions = async () => {
    if (!window.confirm("Are you sure you want to delete all sessions?")) {
      return;
    }

    try {
      setLoading(true);
      const result = await api.deleteAllSessions();
      setSessions([]);
      setSnackbar({
        open: true,
        message: `Successfully deleted ${result.count} sessions`,
        severity: "success",
      });
    } catch (err) {
      setError("Failed to delete all sessions");
      setSnackbar({
        open: true,
        message: "Failed to delete all sessions",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Session Manager
          </Typography>
          <Button
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={fetchSessions}
          >
            Refresh
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="h5" gutterBottom>
                Manage Todo App Sessions
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create and manage isolated instances of the Todo application.
              </Typography>
            </Box>
            <Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreateSession}
                disabled={loading}
                sx={{ mr: 2 }}
              >
                New Session
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteAllIcon />}
                onClick={handleDeleteAllSessions}
                disabled={loading || sessions.length === 0}
              >
                Delete All
              </Button>
            </Box>
          </Box>
        </Paper>

        {loading && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        )}

        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            Active Sessions ({sessions.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {sessions.length === 0 && !loading ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                No active sessions. Click "New Session" to create one.
              </Typography>
            </Paper>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={handleDeleteSession}
              />
            ))
          )}
        </Box>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
