import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
const PORT = process.env.PORT || 8000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
});
let Users = []; // [ socket_id1, socket_id2,socket_id3,...]
io.on("connection", (socket) => {
  console.log("New User connected");
  socket.emit("YourSocketId", { socketID: socket.id });
  Users.push(socket.id);
  socket.on("getAllConnectedUsers", () => {
    const userData = Users.filter((user) => user !== socket.id);
    socket.emit("AllConnectedUsers", { users: userData });
  });
  socket.on("callUser", ({ userToCall, signalData }) => {
    socket
      .to(userToCall)
      .emit("incommingCall", { signalData: signalData, from: socket.id });
  });
  socket.on("acceptingCall", ({ acceptingCallFrom, signalData }) => {
    socket
     .to(acceptingCallFrom)
     .emit("callAccepted", { signalData: signalData, from: socket.id });
  });
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`Server is running on port http://localhost:${PORT}`);
});
