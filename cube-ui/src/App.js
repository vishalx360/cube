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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import {
  Add as AddIcon,
  DeleteSweep as DeleteAllIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import SystemMetrics from "./components/SystemMetrics";
import AllContainers from "./components/AllContainers";
import * as api from "./services/api";
import theme from "./theme";

function App() {
  const [sessions, setSessions] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [createSessionLoading, setCreateSessionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  // Check health status
  const checkHealth = async () => {
    try {
      const health = await api.checkHealth();
      setHealthStatus(health.status === "ok");
    } catch (error) {
      setHealthStatus(false);
    }
  };

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

  const fetchImages = async () => {
    try {
      setLoading(true);
      const data = await api.listImages();
      setImages(data);
    } catch (err) {
      console.error("Failed to fetch images:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchSessions();
    fetchImages();
  }, []);

  const handleCreateSession = async () => {
    if (!selectedImage) {
      setSnackbar({
        open: true,
        message: "Please select an image",
        severity: "error",
      });
      return;
    }

    try {
      setCreateSessionLoading(true);
      const config = {
        image_name: selectedImage,
      };

      const newSession = await api.createSession(config);
      setSessions((prev) => [...prev, newSession]);
      setSnackbar({
        open: true,
        message: "New session created successfully!",
        severity: "success",
      });
      setCreateDialogOpen(false);
      setSelectedImage("");
    } catch (err) {
      setError("Failed to create session");
      setSnackbar({
        open: true,
        message:
          "Failed to create session: " +
          (err.response?.data?.error || err.message),
        severity: "error",
      });
    } finally {
      setCreateSessionLoading(false);
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
      setDeleteAllLoading(true);
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
      setDeleteAllLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setSelectedImage("");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Cube
            </Typography>
            {healthStatus !== null && (
              <Box mr={2}>
                <Chip
                  icon={healthStatus ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={healthStatus ? "Server Online" : "Server Offline"}
                  color={healthStatus ? "success" : "error"}
                  variant="outlined"
                />
              </Box>
            )}
            <Button
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={() => {
                fetchSessions();
                fetchImages();
                checkHealth();
              }}
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
                  Manage Container Sessions
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Create and manage isolated containers with any Docker image.
                </Typography>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={createSessionLoading ? null : <AddIcon />}
                  onClick={handleOpenCreateDialog}
                  disabled={loading || createSessionLoading}
                  sx={{ mr: 2 }}
                >
                  {createSessionLoading ? (
                    <>
                      <CircularProgress
                        size={20}
                        sx={{ mr: 1 }}
                        color="inherit"
                      />
                      Creating...
                    </>
                  ) : (
                    "New Session"
                  )}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={deleteAllLoading ? null : <DeleteAllIcon />}
                  onClick={handleDeleteAllSessions}
                  disabled={
                    deleteAllLoading || loading || sessions.length === 0
                  }
                >
                  {deleteAllLoading ? (
                    <>
                      <CircularProgress
                        size={20}
                        sx={{ mr: 1 }}
                        color="error"
                      />
                      Deleting...
                    </>
                  ) : (
                    "Delete All"
                  )}
                </Button>
              </Box>
            </Box>
          </Paper>

          {loading && (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          )}

          {/* Metrics Section */}
          <SystemMetrics />

          {/* All Containers Section */}
          <AllContainers />
        </Container>

        {/* Create Session Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={handleCloseCreateDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Create New Session
            <IconButton
              aria-label="close"
              onClick={handleCloseCreateDialog}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box mt={2}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="image-select-label">
                      Docker Image
                    </InputLabel>
                    <Select
                      labelId="image-select-label"
                      id="image-select"
                      value={selectedImage}
                      label="Docker Image"
                      onChange={(e) => setSelectedImage(e.target.value)}
                    >
                      {images.map((image) => (
                        <MenuItem
                          key={image.id}
                          value={image.name + ":" + image.tag}
                        >
                          {image.name}:{image.tag}
                          <Tooltip
                            title={`Exposed ports: ${
                              image.exposed_ports?.join(", ") || "None"
                            }`}
                          >
                            <IconButton size="small" sx={{ ml: 1 }}>
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    The Cube Core will automatically detect and allocate ports
                    based on the image's exposed ports.
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreateDialog}>Cancel</Button>
            <Button
              onClick={handleCreateSession}
              color="primary"
              variant="contained"
              disabled={!selectedImage || createSessionLoading}
            >
              {createSessionLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogActions>
        </Dialog>

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
    </ThemeProvider>
  );
}

export default App;
