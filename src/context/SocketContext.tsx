import { createContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";

export interface SocketEvents {
  taskCreated: (task: unknown) => void;
  taskUpdated: (task: unknown) => void;
  activityCreated: (activity: unknown) => void;
}
export type AppSocket = Socket<SocketEvents>;
export const SocketContext = createContext<AppSocket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<AppSocket | null>(null);
  useEffect(() => {
    const connection = io(import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000");
    connection.on("connect_error", (error) => console.warn("Socket connection failed:", error.message));
    setSocket(connection);
    return () => { connection.disconnect(); setSocket(null); };
  }, []);
  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
