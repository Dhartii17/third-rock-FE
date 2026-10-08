import { createTheme } from "@mui/material/styles";
export const theme = createTheme({
  palette: { primary: { main: "#4f46e5", light: "#eef2ff" }, secondary: { main: "#0f766e" }, background: { default: "#f5f7fb", paper: "#ffffff" } },
  shape: { borderRadius: 12 }, typography: { fontFamily: "Inter, Roboto, Arial, sans-serif", h4: { fontWeight: 800, letterSpacing: "-.03em" }, h5: { fontWeight: 800, letterSpacing: "-.02em" } },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 10, textTransform: 'none', fontWeight: 700 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 800, color: '#667085', backgroundColor: '#f8fafc' }, root: { borderColor: '#edf0f5' } } },
    MuiTextField: { defaultProps: { variant: 'outlined' } },
  },
});
