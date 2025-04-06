import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Link,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  DeleteOutline as DeleteIcon,
  Launch as LaunchIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import SessionMetrics from "./SessionMetrics";

const SessionCard = ({ session, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get a short version of the ID for display
  const shortId = session.id.substring(0, 8);

  // Get a short version of container ID for display
  const shortContainerId =
    session.container_id && session.container_id.length > 12
      ? session.container_id.substring(0, 12)
      : session.container_id;

  const handleDelete = async () => {
    if (isDeleting) return; // Prevent multiple clicks

    try {
      setIsDeleting(true);
      await onDelete(session.id);
    } catch (error) {
      console.error("Error deleting session:", error);
      setIsDeleting(false);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Box>
                <Typography variant="h6" component="div">
                  Session: {shortId}...
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Container: {shortContainerId}...
                </Typography>
              </Box>
              <Box>
                <Chip
                  label={session.status}
                  color={session.status === "running" ? "success" : "error"}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={session.image_name}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
            <Typography color="text.secondary" gutterBottom>
              Created: {formatDate(session.created_at)}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Available Ports:
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {session.ports && session.ports.length > 0 ? (
              <List dense>
                {session.ports.map((port, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {port.url ? (
                        <LaunchIcon color="primary" />
                      ) : (
                        <LinkIcon color="disabled" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        port.url ? (
                          <Link href={port.url} target="_blank" rel="noopener">
                            {port.description || `Port ${index + 1}`} -{" "}
                            {port.url}
                          </Link>
                        ) : (
                          `${port.description || `Port ${index + 1}`} - Host: ${
                            port.host_port
                          } → Container: ${port.container_port}/${
                            port.protocol
                          }`
                        )
                      }
                      secondary={`Host Port: ${port.host_port} → Container Port: ${port.container_port}/${port.protocol}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No ports exposed
              </Typography>
            )}
          </Grid>

          {/* Add the SessionMetrics component if the session is running */}
          {session.status === "running" && (
            <Grid item xs={12}>
              <SessionMetrics sessionId={session.id} />
            </Grid>
          )}

          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="outlined"
                color="error"
                startIcon={isDeleting ? null : <DeleteIcon />}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SessionCard;
