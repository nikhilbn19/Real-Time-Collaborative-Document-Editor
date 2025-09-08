import { createContext } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";
const socket = io(SOCKET_URL, {
  transports: ["websocket"], // helps on some hosts
});

const SocketContext = createContext(socket);

export { socket, SocketContext };
