import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#FFFFFF",
      light: "#FFFFFF",
      dark: "#CCCCCC",
      contrastText: "#000000",
    },
    secondary: {
      main: "#CCCCCC",
      light: "#FFFFFF",
      dark: "#999999",
      contrastText: "#000000",
    },
    background: {
      default: "#000000",
      paper: "#121212",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#CCCCCC",
    },
    error: {
      main: "#FF4444",
      light: "#FF6666",
      dark: "#CC3333",
    },
    success: {
      main: "#44FF44",
      light: "#66FF66",
      dark: "#33CC33",
    },
    divider: "rgba(255, 255, 255, 0.12)",
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#000000",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        outlinedPrimary: {
          borderColor: "#FFFFFF",
          color: "#FFFFFF",
        },
        outlinedSuccess: {
          borderColor: "#44FF44",
          color: "#44FF44",
        },
        outlinedError: {
          borderColor: "#FF4444",
          color: "#FF4444",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        outlined: {
          borderColor: "#FFFFFF",
          color: "#FFFFFF",
          "&:hover": {
            borderColor: "#CCCCCC",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
        },
        contained: {
          backgroundColor: "#FFFFFF",
          color: "#000000",
          "&:hover": {
            backgroundColor: "#CCCCCC",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "#FFFFFF",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.12)",
        },
        bar: {
          backgroundColor: "#FFFFFF",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        },
        head: {
          fontWeight: 600,
          color: "#FFFFFF",
        },
      },
    },
  },
});

export default theme;
