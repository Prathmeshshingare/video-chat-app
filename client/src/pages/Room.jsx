import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import "./Room.css";
// import PatientClinicDropdown from "../components/PatientClinicDropdown";
import { IoPersonAdd } from "react-icons/io5";
import { FaVideo, FaVideoSlash, FaMicrophoneAlt } from "react-icons/fa";
import { IoMdMicOff } from "react-icons/io";
import { MdCallEnd } from "react-icons/md";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { HiMiniSpeakerXMark } from "react-icons/hi2";
import RightSideBar from "../components/RightSideBar";
import Transcript from "../components/Transcript";
import Chat from "../components/Chat";
import Information from "../components/Information";
import Appointment from "../components/Appointment";
import AppointmentDetails from "../components/AppointmentDetails";
import TopNav from "../components/TopNav";
const VideoRoom = () => {
  const { roomId } = useParams();

  const email = sessionStorage.getItem("userEmail") || "";

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

  // State
  const [connected, setConnected] = useState(false);
  const [sttConnected, setSttConnected] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [myStream, setMyStream] = useState(null);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedClinic, setSelectedClinic] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [speakerOn, setSpeakerOn] = useState(true);
  const [active, setActive] = useState("chat");
  /* =========================
      Create Peer Connection
  ========================== */
  const createPeer = () => {
    peerRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    remoteVideoRef.current.srcObject = remoteStreamRef.current;

    peerRef.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
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

  /* =========================
      Start Camera
  ========================== */
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

  /* =========================
      Start Call
  ========================== */
  const startCall = async () => {
    setIsCaller(true);
    await startCamera();

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    socketRef.current.send(JSON.stringify({ type: "offer", offer }));
  };

  const toggleSpeaker = () => {
    if (!remoteVideoRef.current) return;

    const videoElement = remoteVideoRef.current;

    // Toggle mute
    videoElement.muted = !videoElement.muted;

    setSpeakerOn((prev) => !prev);
  };
  /* =========================
      WebRTC Signaling
  ========================== */
  useEffect(() => {
    // socketRef.current = new WebSocket(`ws://127.0.0.1:8000/ws/call/${roomId}/`);
    socketRef.current = new WebSocket(
      `ws://192.168.10.192:8000/ws/call/${roomId}/`,
    );

    createPeer();

    socketRef.current.onopen = () => {
      setConnected(true);
      // Register as Doctor
      socketRef.current.send(
        JSON.stringify({ type: "register_role", role: "Doctor" }),
      );
    };

    socketRef.current.onmessage = async (e) => {
      const data = JSON.parse(e.data);

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

  /* =========================
      STT: Connect to Django Gateway
  ========================== */
  useEffect(() => {
    if (!myStream) return;

    // Connect to Django STT WebSocket
    sttSocketRef.current = new WebSocket(
      //  `ws://127.0.0.1:8000/ws/stt/${roomId}/`,
      `ws://192.168.10.192:8000/ws/stt/${roomId}/`,
    );

    sttSocketRef.current.onopen = () => {
      console.log("✅ Connected to Django STT Gateway");
      setSttConnected(true);

      // Register role first
      sttSocketRef.current.send(
        JSON.stringify({ type: "register_role", role: "Doctor" }),
      );

      // Wait a bit for registration, then start audio
      setTimeout(() => {
        startAudioCapture();
      }, 500);
    };

    sttSocketRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === "transcript") {
          const timestamp = new Date().toLocaleTimeString();
          // const newLine = `[${timestamp}] ${data.speaker}: ${data.text}\n`;
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

  /* =========================
      Capture Audio and Send to Django
  ========================== */
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

      console.log("🎤 Started sending audio to Django (Doctor)");
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

  /* =========================
    Toggle Microphone
========================= */
  const toggleMic = () => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setMicOn((prev) => !prev);
  };

  /* =========================
    Toggle Camera
========================= */
  const toggleCamera = () => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setCameraOn((prev) => !prev);
  };

  /* =========================
      Save Notes to Database
  ========================== */
  const saveNotes = async () => {
    if (!notes.trim()) {
      alert("No notes to save");
      return;
    }

    setIsSaving(true);

    try {
      // const response = await fetch("http://127.0.0.1:8000/api/save-notes/", {
      const response = await fetch(
        "http://192.168.10.192:8000/api/save-notes/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            notes,
            patient_id: selectedPatient,
            clinic_id: selectedClinic,
            doctor_id: selectedDoctor,
          }),
        },
      );

      if (response.ok) {
        alert("✅ Notes saved successfully!");
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || "Failed to save notes"}`);
      }
      setNotes("");
    } catch (err) {
      console.error("Save error:", err);
      alert("❌ Network error. Could not save notes.");
    } finally {
      setIsSaving(false);
    }
  };
  /* =========================
    End Call
========================= */
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

      console.log("📴 Call ended successfully");
    } catch (err) {
      console.error("Error ending call:", err);
    }
  };

  /* =========================
      UI
  ========================== */
  return (
    <div className="consult-container">
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h2>🩺 Doctor Room: {roomId}</h2>
      </div>
      {/*<div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p style={{ color: connected ? "green" : "orange", margin: 5 }}>
           {connected ? "✅ Connected" : "⏳ Connecting..."}
        </p>
        </div>*/}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p style={{ color: sttConnected ? "green" : "orange", margin: 5 }}>
          {sttConnected
            ? "✅ Connected to Patient "
            : "⏳ Connecting to Patient"}
        </p>
      </div>
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div className="center-wrapper">
          {/* <PatientClinicDropdown
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
            selectedClinic={selectedClinic}
            setSelectedClinic={setSelectedClinic}
            selectedDoctor={selectedDoctor}
            setSelectedDoctor={setSelectedDoctor}
          /> */}
        </div>
      </div>
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {!isCaller && (
          <button
            onClick={startCall}
            className="call-btn enabled"
            style={{
              padding: "10px 20px",
              fontSize: 16,
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              marginBottom: 20,
            }}
          >
            📞 Start Call
          </button>
        )}
      </div>
      <div className="call-layout">
        {/* VIDEO AREA */}
           <TopNav/>
        <div className="remote-container">
     
          <div className="call-header">
            <div className="user-badge">Patient</div>
            <div className="timer-badge">04:60</div>
          </div>

          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />

          {/* Local Video */}
          <div className="local-container">
            <div className="you-badge">You</div>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="local-video"
            />
          </div>

          {/* Controls */}
          <div className="call-controls">
            {!isCaller && (
              <button className="control-btn" onClick={startCall}>
                Start
              </button>
            )}

            <button onClick={toggleMic} className="control-btn">
              {micOn ? (
                <FaMicrophoneAlt />
              ) : (
                <IoMdMicOff style={{ color: "red" }} />
              )}
            </button>

            <button className="end-call-circle" onClick={endCall}>
              <MdCallEnd color="white" />
            </button>

            <button onClick={toggleCamera} className="control-btn">
              {cameraOn ? (
                <FaVideo />
              ) : (
                <FaVideoSlash style={{ color: "red" }} />
              )}
            </button>

            <button onClick={toggleSpeaker} className="control-btn">
              {speakerOn ? (
                <HiMiniSpeakerWave />
              ) : (
                <HiMiniSpeakerXMark style={{ color: "red" }} />
              )}
            </button>
          </div>
        </div>

        {/* SIDEBAR — OUTSIDE */}

  {!active && (
            <RightSideBar active={active} setActive={setActive} />
          )}

  {active && (
    <div className="sidebar-section">
         <AppointmentDetails active={active} setActive={setActive} />
      {active === "chat" && <Chat />}
      {active === "Transcript" && <Transcript notes={notes} />}
      {active === "info" && <Information />}
      {active === "appt" && <Appointment />}

    </div>
  )}
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
      <div className="speech-container">
        <h3>📝 Consultation Notes</h3>
        <textarea
          rows="15"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Live conversation transcript will appear here..."
          style={{
            width: "100%",
            padding: "10px",
            fontSize: 14,
            height: "140px",
            fontFamily: "monospace",
            border: "1px solid #ccc",
            borderRadius: 5,
            marginTop: 10,
            resize: "vertical",
          }}
        />

        <div>
          <button
            onClick={saveNotes}
            disabled={isSaving}
            style={{
              padding: "8px 16px",
              fontSize: 14,
              backgroundColor: isSaving ? "#ccc" : "#2196F3",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            {isSaving ? "💾 Saving..." : "💾 Save Notes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoRoom;
