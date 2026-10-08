import { useEffect, useState } from "react";
import { Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { fetchStats } from "../api/task.api";
import { useSocket } from "../hooks/useSocket";
import type { Stats } from "../types";
const empty: Stats = { totalTasks: 0, byStatus: { todo: 0, "in-progress": 0, done: 0 }, mostCommonTag: null };
export function Stats() {
    const socket = useSocket();
    const [stats, setStats] = useState<Stats>(empty);
    const load = async () => setStats(await fetchStats());
    useEffect(() => { void load() }, []);
    useEffect(() => {
        if (!socket) return;
        const refresh = () => void load();
        socket.on("taskCreated", refresh);
        socket.on("taskUpdated", refresh);
        return () => {
            socket.off("taskCreated", refresh);
            socket.off("taskUpdated", refresh)
        }
    },
        [socket]);
    return <Stack spacing={3}><div><Typography variant="h4" fontWeight={800}>Stats</Typography><Typography color="text.secondary">Live task statistics.</Typography></div><Grid container spacing={2}>{[["Total tasks", stats.totalTasks], ["To do", stats.byStatus.todo], ["In progress", stats.byStatus["in-progress"]], ["Done", stats.byStatus.done]].map(([l, v]) => <Grid item xs={12} sm={6} md={3} key={l as string}><Card><CardContent><Typography variant="h4" fontWeight={800}>{v}</Typography><Typography color="text.secondary">{l}</Typography></CardContent></Card></Grid>)}<Grid item xs={12}><Card><CardContent><Typography color="text.secondary">Most common tag</Typography><Typography variant="h5" mt={1}>{stats.mostCommonTag || "—"}</Typography></CardContent></Card></Grid></Grid></Stack>
}
