import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Patient.css";
import Draggable from "react-draggable";
import { FaVideo, FaVideoSlash, FaMicrophoneAlt } from "react-icons/fa";
import { IoMdMicOff } from "react-icons/io";
import { MdCallEnd } from "react-icons/md";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { HiMiniSpeakerXMark } from "react-icons/hi2";
import { MdWifiCalling3 } from "react-icons/md";
import { MdScreenShare } from "react-icons/md";
import { MdStopScreenShare } from "react-icons/md";
import RightSideBar from "../components/RightSideBar";
import Transcript from "../components/Transcript";
import Chat from "../components/Chat";
import Information from "../components/Information";
import Appointment from "../components/Appointment";
import AppointmentDetails from "../components/AppointmentDetails";
import TopNav from "../components/TopNav";
import useCallTimer from "../hooks/useCallTimer";

const Patient = () => {
  const { roomId } = useParams();

  // WebRTC refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());

  // STT refs
  const sttSocketRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);

  //for dragable
  const nodeRefp = useRef(null);

  // State
  const [connected, setConnected] = useState(false);
  const [sttConnected, setSttConnected] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [myStream, setMyStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [active, setActive] = useState("");
  const [notes, setNotes] = useState("");
  const [isMini, setIsMini] = useState(false);

  const [isCallActive, setIsCallActive] = useState(false);
  const { formattedTime, resetTimer } = useCallTimer(isCallActive);
  const [chatMessages, setChatMessages] = useState([]);

  const navigate = useNavigate();
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef(null);
  const role = "Patient";

  useEffect(() => {
    if (myStream) {
      setIsCallActive(true); // 🔥 START TIMER
    }
  }, [myStream]);
  /* Create Peer Connection */
  const createPeer = () => {
    peerRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    remoteVideoRef.current.srcObject = remoteStreamRef.current;

    peerRef.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
        setIsCallActive(true);
      });
    };

    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.send(
          JSON.stringify({ type: "ice", candidate: event.candidate }),
        );
      }
    };
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      screenStreamRef.current = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];

      // Replace video track in peer connection
      const sender = peerRef.current
        .getSenders()
        .find((s) => s.track.kind === "video");

      if (sender) {
        sender.replaceTrack(screenTrack);
      }

      // Show screen locally
      localVideoRef.current.srcObject = screenStream;

      setIsScreenSharing(true);

      // When user clicks "Stop sharing"
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const stopScreenShare = () => {
    if (!screenStreamRef.current) return;

    const cameraTrack = localStreamRef.current.getVideoTracks()[0];

    const sender = peerRef.current
      .getSenders()
      .find((s) => s.track.kind === "video");

    if (sender && cameraTrack) {
      sender.replaceTrack(cameraTrack);
    }

    // Restore local camera preview
    localVideoRef.current.srcObject = localStreamRef.current;

    screenStreamRef.current.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;

    setIsScreenSharing(false);
  };
  /*Start Camera */
  const startCamera = async () => {
    if (localStreamRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setMyStream(stream);
      localStreamRef.current = stream;
      localVideoRef.current.srcObject = stream;

      stream
        .getTracks()
        .forEach((track) => peerRef.current.addTrack(track, stream));
    } catch (err) {
      console.error("Camera error:", err);
      alert("Failed to access camera/microphone");
    }
  };

  /*Start Call*/
  const startCall = async () => {
    setIsCaller(true);
    await startCamera();

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    socketRef.current.send(JSON.stringify({ type: "offer", offer }));
  };

  /*WebRTC Signaling */
  useEffect(() => {
    // socketRef.current = new WebSocket(`ws://127.0.0.1:8000/ws/call/${roomId}/`);
    socketRef.current = new WebSocket(
      `ws://192.168.10.192:8000/ws/call/${roomId}/`,
    );

    createPeer();

    socketRef.current.onopen = () => {
      setConnected(true);
      // Register as Patient
      socketRef.current.send(
        JSON.stringify({ type: "register_role", role: "Patient" }),
      );
    };

    socketRef.current.onmessage = async (e) => {
      const data = JSON.parse(e.data);

      // 🔥 CHAT MESSAGE
      if (data.type === "chat") {
        const isMine = data.sender === role; // use dynamic role

        console.log("Socket received:", data);

        // Send read receipt only if message is NOT mine
        if (!isMine) {
          socketRef.current.send(
            JSON.stringify({
              type: "read-receipt",
              id: data.id,
            }),
          );
        }

        // ✅ Prevent duplicate messages
        setChatMessages((prev) => {
          const alreadyExists = prev.some((msg) => msg.id === data.id);
          if (alreadyExists) return prev;
          return [...prev, data];
        });

        return;
      }

      if (data.type === "read-receipt") {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.id ? { ...msg, status: "read" } : msg,
          ),
        );
        return;
      }
      if (data.type === "offer") {
        await startCamera();
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(data.offer),
        );

        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);

        socketRef.current.send(JSON.stringify({ type: "answer", answer }));
      }

      if (data.type === "answer") {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer),
        );
      }

      if (data.type === "ice") {
        try {
          await peerRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate),
          );
        } catch (err) {
          console.error("ICE error:", err);
        }
      }
    };

    return () => {
      socketRef.current?.close();
      peerRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [roomId]);

  /*STT: Connect to Django Gateway */
  useEffect(() => {
    if (!myStream) return;

    // Connect to Django STT WebSocket
    sttSocketRef.current = new WebSocket(
      // `ws://127.0.0.1:8000/ws/stt/${roomId}/`,
      `ws://192.168.10.192:8000/ws/stt/${roomId}/`,
    );

    sttSocketRef.current.onopen = () => {
      console.log("✅ Connected to Django STT Gateway");
      setSttConnected(true);

      // Register role first
      sttSocketRef.current.send(
        JSON.stringify({ type: "register_role", role: "Patient" }),
      );

      // Wait a bit for registration, then start audio
      setTimeout(() => {
        startAudioCapture();
      }, 500);
    };

    sttSocketRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        // Patient receives transcripts but doesn't display them
        if (data.type === "transcript") {
          const newLine = ` ${data.speaker}: ${data.text}\n`;
          setNotes((prev) => prev + newLine);
        }

        if (data.type === "error") {
          console.error("STT Error:", data.message);
        }
      } catch (err) {
        console.error("Error parsing STT message:", err);
      }
    };

    sttSocketRef.current.onerror = (err) => {
      console.error("STT Socket error:", err);
      setSttConnected(false);
    };

    sttSocketRef.current.onclose = () => {
      console.log("❌ STT Socket closed");
      setSttConnected(false);
      stopAudioCapture();
    };

    return () => {
      stopAudioCapture();
      sttSocketRef.current?.close();
    };
  }, [myStream, roomId]);

  /* Capture Audio and Send to Django */
  const startAudioCapture = () => {
    if (!myStream) return;

    try {
      // Create AudioContext
      audioContextRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )({ sampleRate: 16000 });

      const source = audioContextRef.current.createMediaStreamSource(
        new MediaStream(myStream.getAudioTracks()),
      );

      // Create ScriptProcessor for audio data
      processorRef.current = audioContextRef.current.createScriptProcessor(
        4096,
        1,
        1,
      );

      processorRef.current.onaudioprocess = (e) => {
        if (sttSocketRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);

          // Convert float32 to int16
          const int16Data = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          // Send to Django
          sttSocketRef.current.send(int16Data.buffer);
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      console.log("🎤 Started sending audio to Django (Patient)");
    } catch (err) {
      console.error("Error starting audio capture:", err);
    }
  };

  const stopAudioCapture = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };
  /* Toggle Microphone*/
  const toggleMic = () => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setMicOn((prev) => !prev);
  };

  /*Toggle Camera*/
  const toggleCamera = () => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setCameraOn((prev) => !prev);
  };

  const toggleSpeaker = () => {
    if (!remoteVideoRef.current) return;

    const videoElement = remoteVideoRef.current;

    // Toggle mute
    videoElement.muted = !videoElement.muted;

    setSpeakerOn((prev) => !prev);
  };
  /*  End Call*/
  const endCall = () => {
    try {
      // Stop sending audio to STT
      stopAudioCapture();

      // Close STT socket
      if (sttSocketRef.current) {
        sttSocketRef.current.close();
        sttSocketRef.current = null;
      }

      // Close WebRTC peer
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }

      // Close signaling socket
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      // Stop camera + mic tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      // Clear remote stream
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Reset UI
      setMyStream(null);
      setConnected(false);
      setSttConnected(false);
      setIsCaller(false);
      setMicOn(true);
      setCameraOn(true);
      setIsCallActive(false);
      resetTimer();

      console.log("📴 Call ended successfully");
    } catch (err) {
      console.error("Error ending call:", err);
    }
  };

  /*UI */
  const contentp = (
    <div ref={nodeRefp} className="consult-containerp">
      <div className={`call-layoutp ${isMini ? "mini" : ""}`}>
        {/* VIDEO AREA */}
        <div className="topnavp">
          <TopNav isMini={isMini} setIsMini={setIsMini} />
        </div>
        <div className="remote-container-and-rightsidebar-divp">
          <div className="remote-containerp">
            <div className="call-headerp">
              <div className="user-badgep">Doctor</div>
              <div className="timer-badgep">{formattedTime}</div>
            </div>

            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-videop"
            />

            {/* Local Video */}
            <div className="local-containerp">
              <div className="you-badgep">You</div>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="local-videop"
              />
            </div>

            {/* Controls */}
            <div className="call-controlsp">
              {!isCaller && (
                <button className="control-btnp" onClick={startCall}>
                  <MdWifiCalling3 />
                </button>
              )}

              <button
                onClick={toggleMic}
                className="control-btnp"
                disabled={!isCallActive}
              >
                {micOn ? (
                  <FaMicrophoneAlt />
                ) : (
                  <IoMdMicOff style={{ color: "red" }} />
                )}
              </button>
              <button
                onClick={isScreenSharing ? stopScreenShare : shareScreen}
                className="control-btnp"
                disabled={!isCallActive}
              >
                {isScreenSharing ? <MdStopScreenShare /> : <MdScreenShare />}
              </button>

              <button
                className="end-call-circlep"
                onClick={() => {
                  const finalDuration = formattedTime; // capture before reset
                  endCall();

                  navigate("/feedback", {
                    state: { duration: finalDuration },
                  });
                }}
                disabled={!isCallActive}
              >
                <MdCallEnd color="white" />
              </button>

              <button
                onClick={toggleCamera}
                className="control-btnp"
                disabled={!isCallActive}
              >
                {cameraOn ? (
                  <FaVideo />
                ) : (
                  <FaVideoSlash style={{ color: "red" }} />
                )}
              </button>

              <button
                onClick={toggleSpeaker}
                className="control-btnp"
                disabled={!isCallActive}
              >
                {speakerOn ? (
                  <HiMiniSpeakerWave />
                ) : (
                  <HiMiniSpeakerXMark style={{ color: "red" }} />
                )}
              </button>
            </div>
          </div>

          {/* SIDEBAR — OUTSIDE */}
          <div className={`sidebar-wrapperp ${active ? "active" : ""}`}>
            {!active && <RightSideBar active={active} setActive={setActive} />}
            {active && (
              <div className="sidebar-sectionp">
                <AppointmentDetails active={active} setActive={setActive} />
                {active === "chat" && (
                  <Chat
                    socket={socketRef.current}
                    role="Patient"
                    messages={chatMessages}
                    setMessages={setChatMessages}
                  />
                )}
                {active === "Transcript" && <Transcript notes={notes} />}
                {active === "info" && <Information />}
                {active === "appt" && <Appointment />}
              </div>
            )}{" "}
          </div>
        </div>
      </div>
      <div>
        {myStream && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "15px",
            }}
          ></div>
        )}
      </div>
    </div>
  );
  return (
    <>
      {isMini ? <Draggable nodeRef={nodeRefp}>{contentp}</Draggable> : contentp}
    </>
  );
};

export default Patient;
