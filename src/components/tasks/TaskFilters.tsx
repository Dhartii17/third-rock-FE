import {
  Box,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type {
  TaskListQuery,
  TaskStatus,
  TaskStatusCounts,
} from "../../types";
import { useDebounced } from "../../hooks/useDebounced";
import { useEffect, useState } from "react";

interface TaskFiltersProps {
  query: TaskListQuery;
  counts: TaskStatusCounts;
  onChange: (query: Partial<TaskListQuery>) => void;
}

const labels: Record<TaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
};

export function TaskFilters({
  query,
  counts,
  onChange,
}: TaskFiltersProps) {
  const [search, setSearch] = useState(query.search ?? "");
  const debouncedSearch = useDebounced(search);

  useEffect(() => {
    if ((query.search ?? "") !== debouncedSearch) {
      onChange({
        search: debouncedSearch || undefined,
        page: 1,
      });
    }
  }, [debouncedSearch, query.search, onChange]);

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        value={query.status ?? "all"}
        onChange={(_, value) => {
          if (value !== null) {
            onChange({
              status: value === "all" ? undefined : value,
              page: 1,
            });
          }
        }}
      >
        <ToggleButton value="all">All ({counts.all})</ToggleButton>
        {Object.entries(labels).map(([status, label]) => (
          <ToggleButton key={status} value={status}>
            {label} ({counts[status as TaskStatus]})
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <TextField
        size="small"
        placeholder="Search tasks"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
        }}
        sx={{ minWidth: 260 }}
      />
    </Box>
  );
}
