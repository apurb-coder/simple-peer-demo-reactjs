import React, { useState, useEffect, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const App = () => {
  const [mySocketID, setMySocketID] = useState("");
  const [callerID, setCallerID] = useState("");
  const [myVideoStream, setMyVideoStream] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isInCall, setIsInCall] = useState(false);
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);

  const socket = useMemo(() => {
    return io("http://localhost:8000", {
      reconnectionAttempts: 5,
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
      console.log("All connected users: ", users);
      setConnectedUsers(users);
    });

    socket.on("incommingCall", handleIncomingCall);

    return () => {
      socket.off("YourSocketId");
      socket.off("AllConnectedUsers");
      socket.off("incommingCall", handleIncomingCall);
    };
  }, [socket]);

  useEffect(() => {
    const getLocalVideoStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
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

  const createPeer = (initiator, stream) => {
    return new Peer({
      initiator,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478?transport=udp" },
        ],
      },
    });
  };

  const startCalling = (socketID) => {
    if (!myVideoStream) return;
    console.log("Starting call to:", socketID);

    const peer = createPeer(true, myVideoStream);
    peerRef.current = peer;

    peer.on("signal", (data) => {
      console.log("Signaling to peer:", socketID);
      socket.emit("callUser", {
        userToCall: socketID,
        signalData: data,
        from: mySocketID,
      });
    });

    peer.on("stream", handleRemoteStream);

    socket.on("callAccepted", (signalData) => {
      console.log("Call accepted, signaling peer");
      peer.signal(signalData);
      setIsInCall(true);
    });

    peer.on("error", handlePeerError);
  };

  const handleIncomingCall = ({ callerSignalData, from }) => {
    if (!myVideoStream) return;
    console.log("Incoming call from:", from);

    const peer = createPeer(false, myVideoStream);
    peerRef.current = peer;

    peer.on("signal", (data) => {
      console.log("Signaling back to caller");
      socket.emit("acceptingCall", {
        acceptingCallFrom: from,
        signalData: data,
      });
    });

    peer.on("stream", handleRemoteStream);

    peer.on("error", handlePeerError);

    peer.signal(callerSignalData);
    setCallerID(from);
    setIsInCall(true);
  };

  const handleRemoteStream = (stream) => {
    console.log("Received remote stream");
    if (remoteVideo.current) {
      remoteVideo.current.srcObject = stream;
    }
  };

  const handlePeerError = (err) => {
    console.error("Peer connection error:", err);
    endCall();
  };

  const handleCall = () => {
    if (callerID && !isInCall) {
      startCalling(callerID);
    }
  };

  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    setIsInCall(false);
    setCallerID("");
    if (remoteVideo.current) {
      remoteVideo.current.srcObject = null;
    }
  };

  const handleRequestUsers = () => {
    socket.emit("getAllConnectedUsers");
  };

  useEffect(() => {
    handleRequestUsers();
    const interval = setInterval(handleRequestUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen w-screen text-blue-500">
      <h2 className="mb-6">Video Call demo using simple-peer</h2>
      <div className="flex space-x-4">
        <div className="flex flex-col justify-center items-center">
          <p>My Video</p>
          <video
            id="localVideo"
            autoPlay
            playsInline
            muted
            ref={localVideo}
            className="w-80 h-60 bg-gray-200"
          />
        </div>
        <div className="flex flex-col justify-center items-center">
          <p>Remote Video</p>
          <video
            id="remoteVideo"
            autoPlay
            playsInline
            ref={remoteVideo}
            className="w-80 h-60 bg-gray-200"
          />
        </div>
      </div>
      <div className="mt-4">
        <h3>Connected Users:</h3>
        <ul>
          {connectedUsers.map((user) => (
            <li key={user} className="flex items-center justify-between mb-2">
              <span>{user}</span>
              <button
                onClick={() => setCallerID(user)}
                className="bg-blue-500 text-white px-2 py-1 rounded"
                disabled={isInCall}
              >
                Select
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <input
          type="text"
          value={callerID}
          onChange={(e) => setCallerID(e.target.value)}
          placeholder="Enter caller ID"
          className="px-2 py-1 border rounded"
        />
        <button
          onClick={handleCall}
          className="ml-2 bg-green-500 text-white px-4 py-2 rounded"
          disabled={isInCall || !callerID}
        >
          Call User
        </button>
      </div>
      {isInCall && (
        <button
          onClick={endCall}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
        >
          End Call
        </button>
      )}
    </div>
  );
};

export default App;
