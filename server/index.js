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

const Users = new Set();

const emitUpdatedUserList = () => {
  const userList = Array.from(Users);
  io.emit("AllConnectedUsers", { users: userList });
};

io.on("connection", (socket) => {
  console.log("New User connected:", socket.id);
  socket.emit("YourSocketId", { socketID: socket.id });
  Users.add(socket.id);
  emitUpdatedUserList();

  socket.on("getAllConnectedUsers", () => {
    const userData = Array.from(Users).filter((user) => user !== socket.id);
    socket.emit("AllConnectedUsers", { users: userData });
  });

  socket.on("callUser", ({ userToCall, signalData }) => {
    console.log(`User ${socket.id} is calling ${userToCall}`);
    io.to(userToCall).emit("incommingCall", { signalData, from: socket.id });
  });

  socket.on("acceptingCall", ({ acceptingCallFrom, signalData }) => {
    console.log(
      `User ${socket.id} is accepting call from ${acceptingCallFrom}`
    );
    io.to(acceptingCallFrom).emit("callAccepted", {
      signalData,
      from: socket.id,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    Users.delete(socket.id);
    emitUpdatedUserList();
  });
});

server.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`Server is running on http://localhost:${PORT}`);
});
