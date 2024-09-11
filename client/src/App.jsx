import React, { useState, useEffect, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const App = () => {
  const [mySocketID, setMySocketID] = useState("");
  const [myVideoStream, setMyVideoStream] = useState(null);
  const [allConnectedUsers, setAllConnectedUsers] = useState([]);
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  const socket = useMemo(() => {
    return io("http://localhost:8000", {
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  }, []);
  useEffect(() => {
    if (!socket) return;
    socket.on("YourSocketId", ({ socketID }) => {
      console.log("Your socket ID is: ", socketID);
      setMySocketID(socketID);
    });
    socket.on("AllConnectedUsers", ({ users }) => {
      console.log("All connected users: ");
      console.log(users);
      setAllConnectedUsers(users);
    });
    socket.on("incommingCall", acceptCall); // when call is incomming accept it.
    return () => {
      socket.off("YourSocketId");
      socket.off("AllConnectedUsers");
      socket.off("incommingCall", acceptCall);
    };
  }, [socket]);
  useEffect(() => {
    const getLocalVideoStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setMyVideoStream(stream);
        if (localVideo.current) {
          localVideo.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error getting user media", error);
      }
    };
    getLocalVideoStream();
  }, []);
  const startCalling = (socketID) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: localVideo.current?.srcObject,
      config: {
        iceServers: [
          {
            urls: "stun:numb.viagenie.ca",
            username: "sultan1640@gmail.com",
            credential: "98376683",
          },
          {
            urls: "turn:numb.viagenie.ca",
            username: "sultan1640@gmail.com",
            credential: "98376683",
          },
        ],
      },
    });
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: socketID,
        singnalData: data,
        from: mySocketID,
      });
    });
    peer.on("stream", (stream) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = stream;
      }
    });
    socket.on("callAccepted", () => {
      peer.signal(signalData); // uska signalData save kar raha hai
    });
  };
  const acceptCall = ({ callerSingnalData: signalData, from }) => {
    const peer = new Peer({
      trickle: false,
      stream: localVideo.current?.srcObject,
      config: {
        iceServers: [
          {
            urls: "stun:numb.viagenie.ca",
            username: "sultan1640@gmail.com",
            credential: "98376683",
          },
          {
            urls: "turn:numb.viagenie.ca",
            username: "sultan1640@gmail.com",
            credential: "98376683",
          },
        ],
      },
    });
    peer.on("signal", (data) => {
      socket.emit("acceptingCall", {
        acceptingCallFrom: from,
        singnalData: data, // apna signalData bhej raha hai
      });
    });
    peer.on("stream", (stream) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = stream;
      }
    });
    peer.signal(callerSingnalData); // uska signalData save kar raha hai
  };
  useEffect(() => {
    if (!socket || !myVideoStream) return;
    handleRequestUsers();
    if(allConnectedUsers.length===0) return;
    allConnectedUsers.forEach(user=>{
      startCalling(user);
    })
  }, [socket, myVideoStream,allConnectedUsers]);
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
          <video id="remoteVideo" autoPlay playsInline ref={remoteVideo} />
        </div>
      </div>
      <button
        onClick={handleRequestUsers}
        className=" bg-blue-300 px-4 py-2 rounded-lg"
      >
        Show Users List
      </button>
    </div>
  );
};

export default App;
