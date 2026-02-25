import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import "./Patient.css";
import { FaVideo, FaVideoSlash, FaMicrophoneAlt } from "react-icons/fa";
import { IoMdMicOff } from "react-icons/io";
import { MdCallEnd } from "react-icons/md";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { HiMiniSpeakerXMark } from "react-icons/hi2";

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

  // State
  const [connected, setConnected] = useState(false);
  const [sttConnected, setSttConnected] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [myStream, setMyStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

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
      // Register as Patient
      socketRef.current.send(
        JSON.stringify({ type: "register_role", role: "Patient" }),
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
          console.log(`📝 ${data.speaker}: ${data.text}`);
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
        <h2>🏥 Patient Room: {roomId}</h2>
      </div>

      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* <p style={{ color: connected ? "green" : "orange", margin: 5 }}>
           {connected ? "✅ Connected" : "⏳ Connecting..."} 
        </p>*/}
        <p style={{ color: sttConnected ? "green" : "orange", margin: 5 }}>
          {sttConnected ? "✅ Connected to Doctor" : "⏳ Connecting to Doctor"}
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
        {/* Top Info */}
        <div className="call-header">
          <div className="user-badge">Patient</div>
          <div className="timer-badge">04:60</div>
        </div>

        {/* Remote Video */}
        <div className="remote-container">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
        </div>

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
            {cameraOn ? <FaVideo /> : <FaVideoSlash style={{ color: "red" }} />}
          </button>
        </div>
      </div>

      {/* <div
        style={{
          marginTop: 30,
          padding: 20,
          backgroundColor: "#f0f0f0",
          borderRadius: 8,
        }}
      >
        <p style={{ margin: 0, color: "#666" }}>
          ℹ️ Your conversation is being transcribed for the doctor's notes.
        </p>
        <p style={{ margin: "10px 0 0 0", color: "#999", fontSize: 14 }}>
          Audio → Django Gateway → Deepgram → Doctor's Screen
        </p>
      </div>*/}
    </div>
  );
};

export default Patient;
