import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Divider,
  Tooltip,
  IconButton,
  Collapse,
  Alert,
} from "@mui/material";
import {
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  NetworkCheck as NetworkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { getContainerMetricsForSession } from "../services/api";

// Helper function to format bytes into human-readable format
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return "0 Bytes";
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

const SessionMetrics = ({ sessionId }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  useEffect(() => {
    let intervalId;

    const fetchMetrics = async () => {
      if (!sessionId) {
        setError("No session ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getContainerMetricsForSession(sessionId);
        setMetrics(data);
        setError(null);
      } catch (err) {
        console.error(`Error fetching metrics for session ${sessionId}:`, err);
        setError("Failed to fetch metrics");
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Set up interval to poll every 5 seconds
    intervalId = setInterval(fetchMetrics, 5000);

    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [sessionId]);

  if (loading && !metrics) {
    return (
      <Box p={1}>
        <Typography variant="body2" color="textSecondary">
          Loading metrics...
        </Typography>
        <LinearProgress sx={{ mt: 1, mb: 1 }} />
      </Box>
    );
  }

  if (error && !metrics) {
    return (
      <Box p={1}>
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box p={1}>
        <Typography variant="body2" color="textSecondary">
          No metrics available
        </Typography>
      </Box>
    );
  }

  // Debug log
  console.debug("Rendering session metrics:", metrics);

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          onClick={toggleExpanded}
          sx={{ cursor: "pointer" }}
        >
          <Typography variant="subtitle1">Container Metrics</Typography>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {/* Basic metrics always visible */}
        <Box mt={1}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Tooltip title="CPU Usage">
                <Box display="flex" alignItems="center">
                  <SpeedIcon
                    fontSize="small"
                    color="primary"
                    sx={{ mr: 0.5 }}
                  />
                  <Typography variant="body2">
                    {safeAccess(metrics, "cpu.usage_percent", 0).toFixed(1)}%
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={4}>
              <Tooltip title="Memory Usage">
                <Box display="flex" alignItems="center">
                  <MemoryIcon
                    fontSize="small"
                    color="primary"
                    sx={{ mr: 0.5 }}
                  />
                  <Typography variant="body2">
                    {formatBytes(safeAccess(metrics, "memory.usage_bytes"))}
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={4}>
              <Tooltip title="Uptime">
                <Box display="flex" alignItems="center">
                  <Typography variant="body2">
                    {safeAccess(metrics, "uptime_display", "N/A")}
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>

        {/* Detailed metrics that expand/collapse */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />

          {/* CPU Details */}
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              CPU
            </Typography>
            <Box mb={1}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={0.5}
              >
                <Typography variant="body2" color="textSecondary">
                  Usage
                </Typography>
                <Typography variant="body2">
                  {safeAccess(metrics, "cpu.usage_percent", 0).toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={safeAccess(metrics, "cpu.usage_percent")}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
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
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="textSecondary">
                Usage in cores:
              </Typography>
              <Typography variant="body2">
                {safeAccess(metrics, "cpu.usage_in_cores", 0).toFixed(2)}
              </Typography>
            </Box>
          </Box>

          {/* Memory Details */}
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Memory
            </Typography>
            <Box mb={1}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={0.5}
              >
                <Typography variant="body2" color="textSecondary">
                  Usage
                </Typography>
                <Typography variant="body2">
                  {safeAccess(metrics, "memory.usage_percent", 0).toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={safeAccess(metrics, "memory.usage_percent")}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
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

            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Usage:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  {formatBytes(safeAccess(metrics, "memory.usage_bytes"))}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Limit:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  {formatBytes(safeAccess(metrics, "memory.limit_bytes"))}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Network Details */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Network
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Received:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  {formatBytes(safeAccess(metrics, "network.rx_bytes"))}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Transmitted:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  {formatBytes(safeAccess(metrics, "network.tx_bytes"))}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default SessionMetrics;
