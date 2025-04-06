import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
  Grid,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Link as LinkIcon,
  Launch as LaunchIcon,
  Delete as DeleteIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
} from "@mui/icons-material";
import {
  listAllContainers,
  deleteContainer,
  getContainerMetricsForSession,
} from "../services/api";

const AllContainers = () => {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingContainer, setDeletingContainer] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [containerMetrics, setContainerMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);
  const [metricsInterval, setMetricsInterval] = useState(null);

  const fetchContainers = async () => {
    try {
      setLoading(true);
      const data = await listAllContainers();
      setContainers(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch containers:", err);
      setError("Failed to fetch containers: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const getShortId = (id) => {
    return id?.substring(0, 12) || "";
  };

  const handleOpenDetails = (container) => {
    setSelectedContainer(container);
    setContainerMetrics(null);
    setMetricsLoading(false);
    setMetricsError(null);
    setDetailsOpen(true);

    // Fetch initial metrics if it's a managed container
    if (container.is_managed) {
      fetchContainerMetrics(container);

      // Set up interval for periodic updates
      const interval = setInterval(() => {
        fetchContainerMetrics(container);
      }, 5000);

      setMetricsInterval(interval);
    }
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    // Clear the metrics update interval when dialog closes
    if (metricsInterval) {
      clearInterval(metricsInterval);
      setMetricsInterval(null);
    }
  };

  const fetchContainerMetrics = async (container) => {
    if (!container.is_managed || !container.session_id) return;

    setMetricsLoading(true);
    try {
      const data = await getContainerMetricsForSession(container.session_id);
      console.log("Container metrics response:", data);

      // Check if the data has the expected structure
      if (!data || typeof data !== "object") {
        console.error("Invalid metrics data structure:", data);
        setMetricsError("Invalid metrics data received");
        setContainerMetrics(null);
        return;
      }

      setContainerMetrics(data);
      setMetricsError(null);
    } catch (err) {
      console.error("Failed to fetch container metrics:", err);
      setMetricsError("Failed to fetch metrics");
    } finally {
      setMetricsLoading(false);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    if (!bytes || isNaN(bytes)) return "N/A";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(value)) return "N/A";
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatDuration = (seconds) => {
    if (seconds === undefined || seconds === null || isNaN(seconds))
      return "N/A";

    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getMetricValue = (metrics, key, defaultValue = "N/A") => {
    if (!metrics) return defaultValue;
    const value = metrics[key];
    if (value === undefined || value === null || isNaN(value))
      return defaultValue;
    return value;
  };

  const handleDeleteClick = (container, event) => {
    event.stopPropagation();
    setDeletingContainer(container);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setDeletingContainer(null);
  };

  const handleDeleteContainer = async () => {
    if (!deletingContainer) return;

    try {
      setDeleteLoading(true);
      await deleteContainer(deletingContainer.id);
      setContainers(containers.filter((c) => c.id !== deletingContainer.id));
      setDeleteConfirmOpen(false);
      setDeletingContainer(null);
    } catch (err) {
      setError(`Failed to delete container: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">All Containers</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchContainers}
          disabled={loading}
          variant="outlined"
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress />
        </Box>
      ) : containers.length === 0 ? (
        <Alert severity="info">No Docker containers found</Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Session ID</TableCell>
                <TableCell>Container ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Image</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Managed</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {containers.map((container) => (
                <TableRow key={container.id} hover>
                  <TableCell>
                    {container.session_id ? (
                      <Tooltip title={container.session_id}>
                        <span>{container.session_id.substring(0, 8)}...</span>
                      </Tooltip>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{getShortId(container.id)}</TableCell>
                  <TableCell>{container.name}</TableCell>
                  <TableCell>{container.image}</TableCell>
                  <TableCell>
                    <Chip
                      label={container.status}
                      color={
                        container.state === "running" ? "success" : "default"
                      }
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {container.is_managed ? (
                      <Chip
                        label="Yes"
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label="No"
                        color="default"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>{formatDate(container.created)}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDetails(container)}
                      >
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Container">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => handleDeleteClick(container, e)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Container Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Container Details: {selectedContainer?.name || ""}
        </DialogTitle>
        <DialogContent>
          {selectedContainer && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Basic Information
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" width="30%">
                      Container ID
                    </TableCell>
                    <TableCell>{selectedContainer.id}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Image
                    </TableCell>
                    <TableCell>{selectedContainer.image}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Command
                    </TableCell>
                    <TableCell>{selectedContainer.command}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Status
                    </TableCell>
                    <TableCell>{selectedContainer.status}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      State
                    </TableCell>
                    <TableCell>{selectedContainer.state}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Created
                    </TableCell>
                    <TableCell>
                      {formatDate(selectedContainer.created)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Managed by Cube
                    </TableCell>
                    <TableCell>
                      {selectedContainer.is_managed ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                  {selectedContainer.session_id && (
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Session ID
                      </TableCell>
                      <TableCell>{selectedContainer.session_id}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Container Metrics Section */}
              {selectedContainer.is_managed &&
                selectedContainer.state === "running" && (
                  <Box mt={3}>
                    <Divider sx={{ my: 2 }} />
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography variant="subtitle1" gutterBottom>
                        Container Metrics
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={() => fetchContainerMetrics(selectedContainer)}
                        disabled={metricsLoading}
                      >
                        Refresh
                      </Button>
                    </Box>

                    {metricsError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {metricsError}
                      </Alert>
                    )}

                    {metricsLoading && !containerMetrics ? (
                      <Box display="flex" justifyContent="center" my={2}>
                        <CircularProgress size={30} />
                      </Box>
                    ) : containerMetrics ? (
                      <Grid container spacing={2}>
                        {/* CPU Usage */}
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2 }} variant="outlined">
                            <Box display="flex" alignItems="center" mb={1}>
                              <SpeedIcon
                                sx={{ mr: 1, color: "primary.main" }}
                              />
                              <Typography variant="subtitle2">
                                CPU Usage
                              </Typography>
                            </Box>
                            <Box mt={1}>
                              <Box
                                display="flex"
                                justifyContent="space-between"
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Usage
                                </Typography>
                                <Typography variant="body2">
                                  {formatPercentage(
                                    getMetricValue(
                                      containerMetrics.cpu,
                                      "usage_percent",
                                    ),
                                  )}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    getMetricValue(
                                      containerMetrics.cpu,
                                      "usage_percent",
                                      0,
                                    ),
                                  ),
                                )}
                                sx={{ mt: 0.5, mb: 1.5 }}
                              />
                            </Box>
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Cores Used
                              </Typography>
                              <Box display="flex" mt={0.5}>
                                <Box>
                                  <Typography variant="body2">
                                    {getMetricValue(
                                      containerMetrics.cpu,
                                      "usage_in_cores",
                                      0,
                                    ).toFixed(4)}{" "}
                                    cores
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Paper>
                        </Grid>

                        {/* Memory Usage */}
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2 }} variant="outlined">
                            <Box display="flex" alignItems="center" mb={1}>
                              <MemoryIcon
                                sx={{ mr: 1, color: "primary.main" }}
                              />
                              <Typography variant="subtitle2">
                                Memory Usage
                              </Typography>
                            </Box>
                            <Box mt={1}>
                              <Box
                                display="flex"
                                justifyContent="space-between"
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Usage
                                </Typography>
                                <Typography variant="body2">
                                  {formatBytes(
                                    getMetricValue(
                                      containerMetrics.memory,
                                      "usage_bytes",
                                    ),
                                  )}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    getMetricValue(
                                      containerMetrics.memory,
                                      "usage_percent",
                                      0,
                                    ),
                                  ),
                                )}
                                sx={{ mt: 0.5, mb: 1.5 }}
                              />
                              <Box
                                display="flex"
                                justifyContent="space-between"
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Limit
                                </Typography>
                                <Typography variant="body2">
                                  {formatBytes(
                                    getMetricValue(
                                      containerMetrics.memory,
                                      "limit_bytes",
                                    ),
                                  )}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        </Grid>

                        {/* Network */}
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2 }} variant="outlined">
                            <Typography variant="subtitle2" gutterBottom>
                              Network I/O
                            </Typography>
                            <Box display="flex" mt={1}>
                              <Box mr={3}>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  color="text.secondary"
                                >
                                  Received
                                </Typography>
                                <Typography variant="body2">
                                  {formatBytes(
                                    getMetricValue(
                                      containerMetrics.network,
                                      "rx_bytes",
                                    ),
                                  )}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  color="text.secondary"
                                >
                                  Transmitted
                                </Typography>
                                <Typography variant="body2">
                                  {formatBytes(
                                    getMetricValue(
                                      containerMetrics.network,
                                      "tx_bytes",
                                    ),
                                  )}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        </Grid>

                        {/* Block I/O and Uptime */}
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2 }} variant="outlined">
                            <Typography variant="subtitle2" gutterBottom>
                              Block I/O & Uptime
                            </Typography>
                            <Box display="flex" mt={1}>
                              <Box mr={3}>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  color="text.secondary"
                                >
                                  Read
                                </Typography>
                                <Typography variant="body2">
                                  {formatBytes(
                                    getMetricValue(
                                      containerMetrics.block_io,
                                      "read_bytes",
                                    ),
                                  )}
                                </Typography>
                              </Box>
                              <Box mr={3}>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  color="text.secondary"
                                >
                                  Write
                                </Typography>
                                <Typography variant="body2">
                                  {formatBytes(
                                    getMetricValue(
                                      containerMetrics.block_io,
                                      "write_bytes",
                                    ),
                                  )}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  color="text.secondary"
                                >
                                  Uptime
                                </Typography>
                                <Typography variant="body2">
                                  {getMetricValue(
                                    containerMetrics,
                                    "uptime_display",
                                    "N/A",
                                  )}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>
                    ) : (
                      <Alert severity="info">
                        No metrics available for this container
                      </Alert>
                    )}
                  </Box>
                )}

              {/* Ports Section */}
              {selectedContainer.ports &&
                selectedContainer.ports.length > 0 && (
                  <Box mt={3}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Exposed Ports
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Host Port</TableCell>
                          <TableCell>Container Port</TableCell>
                          <TableCell>Protocol</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedContainer.ports.map((port, index) => (
                          <TableRow key={index}>
                            <TableCell>{port.host_port}</TableCell>
                            <TableCell>{port.container_port}</TableCell>
                            <TableCell>{port.protocol}</TableCell>
                            <TableCell>
                              {port.host_port && (
                                <Tooltip title="Open in browser">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      window.open(
                                        `http://localhost:${port.host_port}`,
                                        "_blank",
                                      )
                                    }
                                  >
                                    <LaunchIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>Delete Container</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete container
            {deletingContainer && (
              <Box component="span" fontWeight="bold">
                {" "}
                {deletingContainer.name || getShortId(deletingContainer.id)}
              </Box>
            )}
            ?
            {deletingContainer?.is_managed && (
              <Box mt={2}>
                <Alert severity="warning">
                  This container is managed by Cube. It's recommended to delete
                  it through the Sessions panel instead.
                </Alert>
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Cancel</Button>
          <Button
            onClick={handleDeleteContainer}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AllContainers;
