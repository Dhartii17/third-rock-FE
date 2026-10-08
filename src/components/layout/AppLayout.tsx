import { AppBar, Box, Button, Chip, Stack, Toolbar, Typography, Snackbar, Alert } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HistoryIcon from "@mui/icons-material/History";
import BarChartIcon from "@mui/icons-material/BarChart";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";

export function AppLayout({ children }: { children: ReactNode }) {
    const socket = useSocket();
    const [notice, setNotice] = useState("");
    useEffect(() => {
        if (!socket) return;
        const created = (t: any) => setNotice(`Task created: ${t?.title ?? "New task"}`);
        const updated = (t: any) => setNotice(`Task updated: ${t?.title ?? "Task"}`);
        socket.on("taskCreated", created);
        socket.on("taskUpdated", updated);
        return () => {
            socket.off("taskCreated", created);
            socket.off("taskUpdated", updated)
        }
    },
        [socket]);
    const linkStyle = ({ isActive }: { isActive: boolean }) => ({ textDecoration: "none", fontWeight: 700, color: isActive ? "inherit" : "inherit" });
    return <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fb" }}><AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider" }}><Toolbar sx={{ gap: 2, flexWrap: "wrap" }}><Typography variant="h6" fontWeight={800} sx={{ flex: 1, minWidth: 180 }}>Task Management</Typography><Stack direction="row" spacing={.5} flexWrap="wrap"><Button component={NavLink} to="/tasks" startIcon={<DashboardIcon />} sx={linkStyle}>All tasks</Button><Button component={NavLink} to="/tasks/todo" sx={linkStyle}>To do</Button><Button component={NavLink} to="/tasks/in-progress" sx={linkStyle}>In progress</Button><Button component={NavLink} to="/tasks/done" sx={linkStyle}>Done</Button><Button component={NavLink} to="/activities" startIcon={<HistoryIcon />} sx={linkStyle}>Latest activities</Button><Button component={NavLink} to="/stats" startIcon={<BarChartIcon />} sx={linkStyle}>Stats</Button></Stack></Toolbar></AppBar><Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>{children}</Box><Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}><Alert onClose={() => setNotice("")} severity="info" variant="filled">{notice}</Alert></Snackbar></Box>;
}
