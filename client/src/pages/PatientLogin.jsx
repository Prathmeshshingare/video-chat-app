
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const PatientLogin = () => {
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const joinRoom = () => {
    if (!email) return alert("Enter your email");

    const finalRoomId = roomId ;

    // Navigate and pass email via state
    navigate(`/patient/room/${finalRoomId}`, { state: { email } });
  };

  return (
    <>
    <div style={{display: "flex",
          justifyContent: "center",
          alignItems: "center",}}>
    <h2 >🏥 Patient</h2>
    </div>
    <div className="homepage-container">
      <h2>Join Video Call</h2>

      <div>
        <form onSubmit={joinRoom}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
                  />
        <input
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          required
                />

        <button>
          Join Room
        </button>
        </form>
      </div>
    </div>
    </>
  );
};
export default PatientLogin;
