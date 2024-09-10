import React, { useEffect, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const App = () => {
  const localVideo = useRef(null);

  const socket = useMemo(() => {
    return io("http://localhost:8000", {
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  }, []);

  useEffect(() => {
    if(!socket) return;
    socket.on("YourSocketId", ({socketID}) =>{
      console.log("Your socket ID is: ", socketID);
    });
    socket.on("AllConnectedUsers", ({users})=>{
      console.log("All connected users: ");
      console.log(users);
      
    });
    return ()=>{
      socket.off("YourSocketId");
    }
  }, [socket]);
  useEffect(() => {
    const getLocalVideoStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (localVideo.current) {
          localVideo.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error getting user media", error);
      }
    };
    getLocalVideoStream();
  }, []);
  const handleRequestUsers = () => {
    socket.emit("getAllConnectedUsers");
  };
  return (
    <div className="flex flex-col justify-center items-center h-screen w-screen text-blue-500">
      <h2 className="mb-6 ">Video Call demo using simple-peer</h2>
      <div className="flex">
        <div className="flex flex-col justify-center items-center">
          <p> My Video</p>
          <video
            id="localVideo"
            autoPlay
            playsInline
            ref={localVideo}
            className="w-80 h-80"
          />
        </div>
        <div className="flex flex-col justify-center items-center">
          <p> Remote Video</p>
          <video id="remoteVideo" autoPlay playsInline />
        </div>
      </div>
      <button onClick={handleRequestUsers} className=" bg-blue-300 px-4 py-2 rounded-lg">Show Users List</button> 

    </div>
  );
};

export default App;
