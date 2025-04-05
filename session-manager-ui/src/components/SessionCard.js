import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Link,
  Box,
} from "@mui/material";
import {
  DeleteOutline as DeleteIcon,
  Launch as LaunchIcon,
  Storage as DatabaseIcon,
  Code as CodeIcon,
} from "@mui/icons-material";

const SessionCard = ({ session, onDelete }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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
              <Typography variant="h6" component="div">
                Session: {session.id.substring(0, 8)}...
              </Typography>
              <Chip
                label={session.status}
                color={session.status === "running" ? "success" : "error"}
                size="small"
              />
            </Box>
            <Typography color="text.secondary" gutterBottom>
              Created: {formatDate(session.created_at)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center">
              <LaunchIcon color="primary" sx={{ mr: 1 }} />
              <Link href={session.frontend_url} target="_blank" rel="noopener">
                Frontend UI ({session.frontend_port})
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center">
              <CodeIcon color="info" sx={{ mr: 1 }} />
              <Link href={session.backend_url} target="_blank" rel="noopener">
                Backend API ({session.backend_port})
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center">
              <DatabaseIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="body2">
                Postgres: {session.postgres_url} ({session.postgres_port})
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(session.id)}
              >
                Delete
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SessionCard;
