import React from "react";
import { IoIosChatboxes } from "react-icons/io";
import { MdSpeakerNotes } from "react-icons/md";
import { MdPerson } from "react-icons/md";
import { AiFillExclamationCircle } from "react-icons/ai";
import "./AppointmentDetails.css";
/*import { useNavigate } from "react-router-dom";
import Chat from "./Chat";
import Information from "./Information";
import Transcript from "./Transcript";
import Appointment from "./Appointment";
import VideoCall from '../pages/VideoCall';*/

const AppointmentDetails = ({ active, setActive }) => {
  // const [active, setActive] = useState(false);
  return (

      <div className="appoint-frame-container">
        <div
          className={`chat-frame ${active === "chat" ? "active" : ""}`}
          onClick={() => {
            setActive(active === "chat" ? null : "chat");
          }}
        >
          <IoIosChatboxes className="iconc" />
          {active === "chat" && <span className="label"> Chat</span>}
        </div>

        <div
          className={`transcript-frame ${active === "Transcript" ? "active" : ""}`}
          onClick={() =>
            setActive(active === "Transcript" ? null : "Transcript")
          }
        >
          <MdSpeakerNotes className="icont" />
          {active === "Transcript" && (
            <span className="label"> Transcript</span>
          )}
        </div>

        <div
          className={`person-frame ${active === "info" ? "active" : ""}`}
          onClick={() => setActive(active === "info" ? null : "info")}
        >
          <MdPerson className="iconi" />
          {active === "info" && <span className="label"> Information</span>}
        </div>

        <div
          className={`appoint-frame ${active === "appt" ? "active" : ""}`}
          onClick={() => setActive(active === "appt" ? null : "appt")}
        >
          <AiFillExclamationCircle className="icona" />
          {active === "appt" && <span className="label">Appt.Details</span>}
        </div>
     
      {/* <div className="content-section">
        {active === "chat" && <Chat />}
        {active === "Transcript" && <Transcript />}
        {active === "info" && <Information />}
        {active === "appt" && <Appointment />}
      </div>
      */}
   </div>
  );
};

export default AppointmentDetails;
