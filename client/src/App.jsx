import React, { useEffect, useRef } from "react";
import { io } from "socket.io-client";
// import Peer from "simple-peer";

const App = () => {
  const localVideo = useRef(null);
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
  return (
    <div className="flex flex-col justify-center items-center h-screen w-screen text-blue-500">
      <h2 className="mb-6 ">Video Call demo using simple-peer</h2>
      <div className="flex">
        <div className="flex flex-col justify-center items-center">
          <p> My Video</p>
          <video id="localVideo" autoPlay playsInline ref={localVideo} className="w-80 h-80" />
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
