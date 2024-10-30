import express from "express";
import http from "http";
import fs from "fs";
import https from "https";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

const app = express();
dotenv.config();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", process.env.FRONT_END_URL],
    credentials: true,
  })
);

const PORT = process.env.PORT || 8000;
const server = http.createServer(app);


const SSL_CRT_FILE = process.env.SSL_CRT_FILE || "../cert/localhost+2.pem"; // your certificate file
const SSL_KEY_FILE = process.env.SSL_KEY_FILE || "../cert/localhost+2-key.pem"; // your private key file
// Read SSL certificate and key
const sslOptions = {
  key: fs.readFileSync(SSL_KEY_FILE),
  cert: fs.readFileSync(SSL_CRT_FILE),
};
// const server = https.createServer(sslOptions, app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", process.env.FRONT_END_URL],
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

const ip = "0.0.0.0"
server.listen(PORT,ip, (err) => {
  if (err) throw err;
  console.log(`Server is running on http://localhost:${PORT}`);
});
