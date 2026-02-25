import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const Homepage = () => {
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  // Generate random 8-char room ID
  const generateRoomId = () => Math.random().toString(36).substring(2, 10);

  const joinRoom = () => {
    if (!email) return alert("Enter your email");

    const finalRoomId = roomId || generateRoomId();

    // Navigate and pass email via state
    sessionStorage.setItem("userEmail", email);
    navigate(`/room/${finalRoomId}`, { state: { email } });
  };

  return (
    <div>
        <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
      <h2 style={{marginTop: "20px",}}>🩺 Doctor</h2>
      </div>
     
      <div className="homepage-container">
        <h2>Create Video Call</h2>

        <div>
          <form onSubmit={joinRoom}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              placeholder="Room ID (optional)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />

            <button>Create Room</button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Homepage;
