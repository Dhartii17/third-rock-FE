import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { SocketProvider } from "./context/SocketContext";
import { AppLayout } from "./components/layout/AppLayout";
import { Tasks } from "./pages/Tasks";
import { Activities } from "./pages/Activities";
import { Stats } from "./pages/Stats";
import { theme } from "./theme/theme";

export default function App() {
    return <ThemeProvider theme={theme}><CssBaseline />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <SocketProvider>
                <AppLayout>
                    <Routes>
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/tasks/todo" element={<Tasks status="todo" />} />
                        <Route path="/tasks/in-progress" element={<Tasks status="in-progress" />} />
                        <Route path="/tasks/done" element={<Tasks status="done" />} />
                        <Route path="/activities" element={<Activities />} />
                        <Route path="/stats" element={<Stats />} />
                        <Route path="*" element={<Navigate to="/tasks" replace />} />
                    </Routes>
                </AppLayout>
            </SocketProvider>
        </BrowserRouter>
    </ThemeProvider>
}
