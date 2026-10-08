import { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, FormControl, IconButton,
  InputAdornment, InputLabel, MenuItem, Pagination, Select, Stack, TextField,
  Tooltip, Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HistoryIcon from "@mui/icons-material/History";
import { fetchActivities, fetchTaskHistory } from "../api/task.api";
import { errorMessage } from "../api/client";
import { useSocket } from "../hooks/useSocket";
import type { Activity, TaskHistoryItem, TaskStatus } from "../types";

const pageSizeOptions = [10, 20, 30];
const statusLabel = (s?: TaskStatus | null) =>
  s === "in-progress" ? "In progress" : s === "todo" ? "To do" : s === "done" ? "Done" : "Unknown";

const statusColor = (s?: TaskStatus | null): "default" | "info" | "warning" | "success" =>
  s === "done" ? "success" : s === "in-progress" ? "warning" : s === "todo" ? "info" : "default";

const actionLabel = (item: TaskHistoryItem | Activity) =>
  item.action === "taskCreated" ? "Task created" : "Status changed";

function StatusTransition({ previousStatus, currentStatus, created = false }: {
  previousStatus?: TaskStatus | null;
  currentStatus: TaskStatus;
  created?: boolean;
}) {
  if (created) {
    return <Chip size="small" label={statusLabel(currentStatus)} color={statusColor(currentStatus)} />;
  }
  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <Chip size="small" label={statusLabel(previousStatus)} color={statusColor(previousStatus)} />
      <SwapHorizIcon sx={{ fontSize: 18 }} color="disabled" />
      <Chip size="small" label={statusLabel(currentStatus)} color={statusColor(currentStatus)} />
    </Stack>
  );
}

export function Activities() {
  const socket = useSocket();
  const [items, setItems] = useState<Activity[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<"all" | "taskCreated" | "taskStatusChanged">("all");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyTask, setHistoryTask] = useState<Activity["task"]>();
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchActivities({
        page: targetPage,
        limit,
        search,
        ...(action !== "all" ? { action } : {}),
      });
      setItems(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages || 1);
    } catch (e) {
      setError(errorMessage(e, "Could not load activities"));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, action]);

  useEffect(() => { setPage(1); }, [limit, search, action]);
  useEffect(() => { void load(page); }, [load, page]);

  useEffect(() => {
    if (!socket) return;
    const onActivity = (activity: Activity) => {
      if (action === "all" || activity.action === action) void load(1);
    };
    socket.on("activityCreated", onActivity);
    return () => { socket.off("activityCreated", onActivity); };
  }, [socket, action, load]);

  const openHistory = async (taskId: string, task?: Activity["task"]) => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryTask(task);
    setHistory([]);
    try {
      const result = await fetchTaskHistory(taskId);
      setHistoryTask(result.task);
      setHistory(result.history);
    } catch (e) {
      setHistoryError(errorMessage(e, "Could not load task history"));
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" fontWeight={800}>Latest activities</Typography>
        <Typography color="text.secondary">A chronological history of task creation and status changes.</Typography>
      </Box>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              fullWidth size="small" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search task title, description or tags..."
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                endAdornment: searchInput ? <InputAdornment position="end"><Tooltip title="Clear search"><IconButton size="small" onClick={() => setSearchInput("")}><ClearIcon fontSize="small" /></IconButton></Tooltip></InputAdornment> : undefined,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Activity</InputLabel>
              <Select value={action} label="Activity" onChange={(e) => { setAction(e.target.value as typeof action); setPage(1); }}>
                <MenuItem value="all">All activities</MenuItem>
                <MenuItem value="taskCreated">Task created</MenuItem>
                <MenuItem value="taskStatusChanged">Status changed</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Per page</InputLabel>
              <Select value={limit} label="Per page" onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                {pageSizeOptions.map((size) => <MenuItem value={size} key={size}>{size} activities</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
        {loading && !items.length ? (
          <Box display="flex" justifyContent="center" p={6}><CircularProgress /></Box>
        ) : items.length ? (
          <Stack divider={<Divider />}>
            {items.map((item) => {
              const task = item.task;
              const created = item.action === "taskCreated";
              return (
                <Box key={item._id} sx={{ px: { xs: 2, md: 3 }, py: 2.5, transition: "background .2s", "&:hover": { bgcolor: "action.hover" } }}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        {created ? <AddCircleOutlineIcon color="success" fontSize="small" /> : <SwapHorizIcon color="primary" fontSize="small" />}
                        <Typography fontWeight={800}>{actionLabel(item)}</Typography>
                        <Typography variant="body2" color="text.secondary">{created ? "New task" : "Task status updated"}</Typography>
                      </Stack>

                      <Typography sx={{ mt: .9, fontWeight: 800, wordBreak: "break-word" }}>{task?.title ?? "Task unavailable"}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: .35, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{task?.description || "No description"}</Typography>

                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                        <StatusTransition previousStatus={item.previousStatus} currentStatus={item.currentStatus} created={created} />
                      </Stack>

                      {task?.tags?.length ? (
                        <Stack direction="row" spacing={.6} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                          {task.tags.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
                        </Stack>
                      ) : null}

                      <Stack direction="row" spacing={.5} alignItems="center" sx={{ mt: 1.2 }}>
                        <AccessTimeIcon sx={{ fontSize: 15 }} color="disabled" />
                        <Typography variant="caption" color="text.secondary">{new Date(item.timestamp).toLocaleString()}</Typography>
                      </Stack>
                    </Box>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<HistoryIcon />}
                      disabled={!item.taskId}
                      onClick={() => item.taskId && void openHistory(item.taskId, item.task)}
                      sx={{ alignSelf: { xs: "flex-start", md: "center" }, whiteSpace: "nowrap" }}
                    >
                      View history
                    </Button>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Box p={6} textAlign="center">
            <SearchIcon sx={{ fontSize: 42, color: "text.disabled", mb: 1 }} />
            <Typography fontWeight={700}>{search ? `No activities found for “${search}”.` : "No activities yet."}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Create or update a task to see activity here.</Typography>
          </Box>
        )}
      </Card>

      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Typography variant="body2" color="text.secondary">{total ? `Showing ${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total}` : "0 activities"}</Typography>
        <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} disabled={loading} color="primary" showFirstButton showLastButton />
      </Box>

      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          <Stack spacing={.5}>
            <Typography variant="h6" fontWeight={800}>Task history</Typography>
            <Typography variant="body2" color="text.secondary">{historyTask?.title ?? "Task"}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
          ) : historyError ? (
            <Alert severity="error">{historyError}</Alert>
          ) : history.length ? (
            <Stack divider={<Divider />}>
              {history.map((entry, index) => (
                <Box key={entry._id} py={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {entry.action === "taskCreated" ? <AddCircleOutlineIcon color="success" fontSize="small" /> : <SwapHorizIcon color="primary" fontSize="small" />}
                    <Typography fontWeight={800}>{actionLabel(entry)}</Typography>
                    {index === history.length - 1 && <Chip size="small" label="Latest" variant="outlined" />}
                  </Stack>
                  <Box sx={{ mt: 1.2, ml: 3.8 }}>
                    <StatusTransition previousStatus={entry.previousStatus} currentStatus={entry.currentStatus} created={entry.action === "taskCreated"} />
                    <Stack direction="row" spacing={.5} alignItems="center" sx={{ mt: 1 }}>
                      <AccessTimeIcon sx={{ fontSize: 15 }} color="disabled" />
                      <Typography variant="caption" color="text.secondary">{new Date(entry.timestamp).toLocaleString()}</Typography>
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">No history found for this task.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
