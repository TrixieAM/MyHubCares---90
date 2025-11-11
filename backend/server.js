import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patient.js";
import facilityRoutes from "./routes/facilities.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/facilities", facilityRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "My Hub Cares API is running" });
});

// 🔌 SOCKET.IO REALTIME CONNECTION
io.on("connection", (socket) => {
  console.log("📱 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });

  socket.on("sendNotification", (data) => {
    console.log("📢 Notification:", data);
    io.emit("newNotification", data);
  });

  // Join room by user ID
  socket.on("joinRoom", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined their room`);
  });

  // Send notification to specific user
  socket.on("sendToUser", ({ userId, notification }) => {
    io.to(`user_${userId}`).emit("newNotification", notification);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 My Hub Cares Server running on http://localhost:${PORT}`)
);