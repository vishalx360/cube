import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Divider,
  Paper,
  Alert,
} from "@mui/material";
import {
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Code as CodeIcon,
} from "@mui/icons-material";
import { getSystemMetrics } from "../services/api";

// Helper function to format bytes into human-readable format
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// Safe access function to handle undefined properties
const safeAccess = (obj, path, defaultValue = 0) => {
  if (!obj) return defaultValue;

  const keys = path.split(".");
  let result = obj;

  for (const key of keys) {
    result = result?.[key];
    if (result === undefined || result === null) {
      return defaultValue;
    }
  }

  return result;
};

const SystemMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await getSystemMetrics();
        if (response && response.metrics) {
          setMetrics(response.metrics);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch metrics data:", err);
        setError("Failed to fetch metrics data");
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Set up polling every 5 seconds
    intervalId = setInterval(fetchMetrics, 5000);

    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  if (loading && !metrics) {
    return (
      <Box p={2}>
        <Typography variant="h6" color="textSecondary" align="center">
          Loading metrics data...
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error && !metrics) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Safety check for missing metrics
  if (!metrics) {
    return (
      <Box p={2}>
        <Typography variant="h6" color="textSecondary" align="center">
          Waiting for metrics data...
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Debug log
  console.debug("Rendering metrics:", metrics);

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box mb={2}>
        <Typography variant="h6" gutterBottom>
          System Metrics
        </Typography>
        <Typography variant="body2" color="textSecondary">
          System metrics updated every 5 seconds
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* CPU Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">CPU</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Box mb={1}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Usage
                </Typography>
                <Box display="flex" alignItems="center">
                  <Box width="100%" mr={1}>
                    <LinearProgress
                      variant="determinate"
                      value={safeAccess(metrics, "cpu.usage_percent")}
                      sx={{
                        height: 8,
                        borderRadius: 5,
                        bgcolor: "background.paper",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 5,
                          bgcolor:
                            safeAccess(metrics, "cpu.usage_percent") > 90
                              ? "error.main"
                              : safeAccess(metrics, "cpu.usage_percent") > 70
                              ? "warning.main"
                              : "success.main",
                        },
                      }}
                    />
                  </Box>
                  <Box minWidth={35}>
                    <Typography variant="body2" color="textSecondary">
                      {Math.round(safeAccess(metrics, "cpu.usage_percent"))}%
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Cores:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {safeAccess(metrics, "cpu.core_count")}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Load (1m):
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {safeAccess(metrics, "cpu.load_avg_1min", 0).toFixed(2)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Load (5m):
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {safeAccess(metrics, "cpu.load_avg_5min", 0).toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <MemoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Memory</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Box mb={1}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Usage
                </Typography>
                <Box display="flex" alignItems="center">
                  <Box width="100%" mr={1}>
                    <LinearProgress
                      variant="determinate"
                      value={safeAccess(metrics, "memory.usage_percent")}
                      sx={{
                        height: 8,
                        borderRadius: 5,
                        bgcolor: "background.paper",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 5,
                          bgcolor:
                            safeAccess(metrics, "memory.usage_percent") > 90
                              ? "error.main"
                              : safeAccess(metrics, "memory.usage_percent") > 70
                              ? "warning.main"
                              : "success.main",
                        },
                      }}
                    />
                  </Box>
                  <Box minWidth={35}>
                    <Typography variant="body2" color="textSecondary">
                      {Math.round(safeAccess(metrics, "memory.usage_percent"))}%
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formatBytes(safeAccess(metrics, "memory.total_bytes"))}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Used:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formatBytes(safeAccess(metrics, "memory.used_bytes"))}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Free:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formatBytes(safeAccess(metrics, "memory.free_bytes"))}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Disk Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Disk</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Box mb={1}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Usage
                </Typography>
                <Box display="flex" alignItems="center">
                  <Box width="100%" mr={1}>
                    <LinearProgress
                      variant="determinate"
                      value={safeAccess(metrics, "disk.usage_percent")}
                      sx={{
                        height: 8,
                        borderRadius: 5,
                        bgcolor: "background.paper",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 5,
                          bgcolor:
                            safeAccess(metrics, "disk.usage_percent") > 90
                              ? "error.main"
                              : safeAccess(metrics, "disk.usage_percent") > 70
                              ? "warning.main"
                              : "success.main",
                        },
                      }}
                    />
                  </Box>
                  <Box minWidth={35}>
                    <Typography variant="body2" color="textSecondary">
                      {Math.round(safeAccess(metrics, "disk.usage_percent"))}%
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formatBytes(safeAccess(metrics, "disk.total_bytes"))}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Used:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formatBytes(safeAccess(metrics, "disk.used_bytes"))}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Free:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formatBytes(safeAccess(metrics, "disk.free_bytes"))}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Docker Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CodeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Docker</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={1}>
                <Grid item xs={8}>
                  <Typography variant="body2" color="textSecondary">
                    Running Containers:
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" fontWeight="bold">
                    {safeAccess(metrics, "docker.running_containers")}
                  </Typography>
                </Grid>

                <Grid item xs={8}>
                  <Typography variant="body2" color="textSecondary">
                    Total Containers:
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2">
                    {safeAccess(metrics, "docker.total_containers")}
                  </Typography>
                </Grid>

                <Grid item xs={8}>
                  <Typography variant="body2" color="textSecondary">
                    Images:
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2">
                    {safeAccess(metrics, "docker.images")}
                  </Typography>
                </Grid>
              </Grid>

              <Box mt={2}>
                <Typography variant="caption" color="textSecondary">
                  Last updated:{" "}
                  {new Date(
                    safeAccess(metrics, "timestamp") * 1000,
                  ).toLocaleTimeString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SystemMetrics;
