import { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Pagination,
  Select, Stack, TextField, Typography, Divider, CircularProgress, Tooltip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HistoryIcon from "@mui/icons-material/History";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { createTask, fetchTasks, fetchTaskHistory, updateTaskStatus } from "../api/task.api";
import { errorMessage, getCurrentUserId } from "../api/client";
import { useSocket } from "../hooks/useSocket";
import type { Task, TaskHistoryItem, TaskInput, TaskStatus } from "../types";

const statusLabel = (s: TaskStatus) => s === "in-progress" ? "In progress" : s === "todo" ? "To do" : "Done";
const statuses: TaskStatus[] = ["todo", "in-progress", "done"];
const pageSizeOptions = [10, 20, 30];
const currentUserId = getCurrentUserId();

const statusColor = (status: TaskStatus): "primary" | "warning" | "success" =>
  status === "done" ? "success" : status === "in-progress" ? "warning" : "primary";

export function Tasks({ status }: { status?: TaskStatus }) {
  const socket = useSocket();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TaskInput>({ title: "", description: "", status: status ?? "todo", tags: [] });
  const [tagText, setTagText] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyTask, setHistoryTask] = useState<Task | null>(null);
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);

  // Debounce search so the API is not called for every key press.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchTasks({ page: p, limit, status, search });
      setTasks(result.data);
      setTotalPages(result.pagination.totalPages || 1);
      setTotal(result.pagination.total);
    } catch (e) {
      setError(errorMessage(e, "Could not load tasks"));
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, search]);

  useEffect(() => { setPage(1); }, [status, limit, search]);
  useEffect(() => { void load(page); }, [load, page]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => void load(page);
    socket.on("taskCreated", refresh);
    socket.on("taskUpdated", refresh);
    return () => {
      socket.off("taskCreated", refresh);
      socket.off("taskUpdated", refresh);
    };
  }, [socket, load, page]);

  const submit = async () => {
    if (!form.title.trim()) return;
    try {
      await createTask(form);
      setOpen(false);
      setForm({ title: "", description: "", status: status ?? "todo", tags: [] });
      setTagText("");
      setPage(1);
      await load(1);
    } catch (e) {
      setError(errorMessage(e, "Could not create task"));
    }
  };

  const changeStatus = async (id: string, next: TaskStatus) => {
    try {
      await updateTaskStatus(id, next);
      await load(page);
    } catch (e) {
      setError(errorMessage(e, "Could not update status"));
    }
  };

  const openHistory = async (task: Task) => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryTask(task);
    setHistory([]);
    try {
      const result = await fetchTaskHistory(task._id);
      setHistoryTask(result.task as Task);
      setHistory(result.history);
    } catch (e) {
      setHistoryError(errorMessage(e, "Could not load task history"));
    } finally {
      setHistoryLoading(false);
    }
  };

  const historyStatusColor = (value?: TaskStatus | null): "default" | "info" | "warning" | "success" =>
    value === "done" ? "success" : value === "in-progress" ? "warning" : value === "todo" ? "info" : "default";

  const renderHistoryStatus = (entry: TaskHistoryItem) =>
    entry.action === "taskCreated" ? (
      <Chip size="small" label={statusLabel(entry.currentStatus)} color={historyStatusColor(entry.currentStatus)} />
    ) : (
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip size="small" label={statusLabel(entry.previousStatus)} color={historyStatusColor(entry.previousStatus)} />
        <SwapHorizIcon sx={{ fontSize: 18 }} color="disabled" />
        <Chip size="small" label={statusLabel(entry.currentStatus)} color={historyStatusColor(entry.currentStatus)} />
      </Stack>
    );

  const heading = status ? `${statusLabel(status)} Tasks` : "All Tasks";
  const emptyMessage = search ? `No tasks found for “${search}”.` : `No ${status ? statusLabel(status).toLowerCase() : ""} tasks found.`;

  return (
    <Stack spacing={2.5}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800}>{heading}</Typography>
          <Typography color="text.secondary">{total} task{total === 1 ? "" : "s"} · live updates enabled</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Create task</Button>
      </Box>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
            <TextField
              fullWidth
              size="small"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title, description or tags..."
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                endAdornment: searchInput ? <InputAdornment position="end"><Tooltip title="Clear search"><IconButton size="small" onClick={() => setSearchInput("")}><ClearIcon fontSize="small" /></IconButton></Tooltip></InputAdornment> : undefined,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Tasks per page</InputLabel>
              <Select value={limit} label="Tasks per page" onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                {pageSizeOptions.map(size => <MenuItem value={size} key={size}>{size} tasks</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
        {loading && !tasks.length ? (
          <Box display="flex" justifyContent="center" p={6}><CircularProgress /></Box>
        ) : tasks.length ? (
          <Stack divider={<Divider />}>
            {tasks.map((task) => (
              <Box key={task._id} sx={{ px: { xs: 2, md: 3 }, py: 2.25, transition: "background .2s", "&:hover": { bgcolor: "action.hover" } }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography fontWeight={800} sx={{ wordBreak: "break-word" }}>{task.title}</Typography>
                      <Chip size="small" color={statusColor(task.status)} label={statusLabel(task.status)} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: .6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {task.description || "No description"}
                    </Typography>
                    <Typography variant="caption" color={task.createdBy === currentUserId ? "success.main" : "text.secondary"} sx={{ mt: .5, display: "block" }}>
                      {task.createdBy === currentUserId ? "Created by you · You can update this task" : "Created by another user · Read only"}
                    </Typography>
                    <Stack direction="row" spacing={.6} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      {task.tags.map(tag => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
                    </Stack>
                    <Stack direction="row" spacing={.5} alignItems="center" sx={{ mt: 1 }}>
                      <AccessTimeIcon sx={{ fontSize: 15 }} color="disabled" />
                      <Typography variant="caption" color="text.secondary">{new Date(task.createdAt).toLocaleString()}</Typography>
                    </Stack>
                  </Box>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ minWidth: { xs: "100%", md: 300 } }}>
                    <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 } }} disabled={task.createdBy !== currentUserId}>
                      <InputLabel>Status</InputLabel>
                      <Select value={task.status} label="Status" onChange={e => void changeStatus(task._id, e.target.value as TaskStatus)}>
                        {statuses.map(s => <MenuItem value={s} key={s}>{statusLabel(s)}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<HistoryIcon />}
                      onClick={() => void openHistory(task)}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      History
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        ) : (
          <Box p={6} textAlign="center">
            <SearchIcon sx={{ fontSize: 42, color: "text.disabled", mb: 1 }} />
            <Typography fontWeight={700}>{emptyMessage}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Try another search or create a new task.</Typography>
          </Box>
        )}
      </Card>

      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Typography variant="body2" color="text.secondary">
          {total ? `Showing ${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total}` : "0 tasks"}
        </Typography>
        <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} disabled={loading} color="primary" showFirstButton showLastButton />
      </Box>

      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          <Stack spacing={0.5}>
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
                    <Typography fontWeight={800}>{entry.action === "taskCreated" ? "Task created" : "Status changed"}</Typography>
                    {index === history.length - 1 && <Chip size="small" label="Latest" variant="outlined" />}
                  </Stack>
                  <Box sx={{ mt: 1.2, ml: 3.8 }}>
                    {renderHistoryStatus(entry)}
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
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
        <DialogActions><Button onClick={() => setHistoryOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create task</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />
            <TextField label="Description" multiline minRows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <FormControl><InputLabel>Status</InputLabel><Select value={form.status} label="Status" onChange={e => setForm({ ...form, status: e.target.value as TaskStatus })}>{statuses.map(s => <MenuItem value={s} key={s}>{statusLabel(s)}</MenuItem>)}</Select></FormControl>
            <TextField label="Tags" placeholder="frontend, urgent" value={tagText} onChange={e => { setTagText(e.target.value); setForm({ ...form, tags: e.target.value.split(",").map(x => x.trim()).filter(Boolean) }); }} helperText="Comma-separated strings" />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" disabled={!form.title.trim() || loading} onClick={() => void submit()}>Create</Button></DialogActions>
      </Dialog>
    </Stack>
  );
}
