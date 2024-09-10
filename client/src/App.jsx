import React from "react";
import { io } from "socket.io-client";
// import Peer from "simple-peer";

const App = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen w-screen text-blue-500">
      <h2 className="mb-6 ">Video Call demo using simple-peer</h2>
      <div className="flex">
        <div className="flex flex-col justify-center items-center">
          <p> My Video</p>
          <video id="localVideo" autoPlay playsInline />
        </div>
        <div className="flex flex-col justify-center items-center">
          <p> Remote Video</p>
          <video id="remoteVideo" autoPlay playsInline />
        </div>
      </div>
    </div>
  );
};

export default App;
