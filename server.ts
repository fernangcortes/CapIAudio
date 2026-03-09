import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Socket.IO logic
  // Simple room-based state sync
  const rooms: Record<string, any> = {};

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      
      // Send current state if exists
      if (rooms[roomId]) {
        socket.emit("sync-state", rooms[roomId]);
      }
    });

    socket.on("update-state", ({ roomId, state }) => {
      // Update server state
      rooms[roomId] = { ...rooms[roomId], ...state };
      // Broadcast to others in the room
      socket.to(roomId).emit("state-updated", state);
    });

    socket.on("add-marker", ({ roomId, marker }) => {
      if (!rooms[roomId]) rooms[roomId] = { markers: [] };
      if (!rooms[roomId].markers) rooms[roomId].markers = [];
      
      rooms[roomId].markers.push(marker);
      socket.to(roomId).emit("marker-added", marker);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
