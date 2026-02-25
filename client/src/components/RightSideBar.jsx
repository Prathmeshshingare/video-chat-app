import React from 'react'
import { IoIosChatboxes } from "react-icons/io";
import { MdSpeakerNotes } from "react-icons/md";
import { MdPerson } from "react-icons/md";
import { AiFillExclamationCircle } from "react-icons/ai";
import './RightSideBar.css';
const RightSideBar = ({ active, setActive }) => {
  return (
    <div className='right-sidebar-container'>

      <div 
        className={`rightsidebar-frame1 ${active === "chat" ? "active" : ""}`}
        onClick={() => setActive("chat")}
      >
        <IoIosChatboxes />
      </div>

      <div 
        className={`rightsidebar-frame2 ${active === "Transcript" ? "active" : ""}`}
        onClick={() => setActive("Transcript")}
      >
        <MdSpeakerNotes />
      </div>

      <div 
        className={`rightsidebar-frame3 ${active === "info" ? "active" : ""}`}
        onClick={() => setActive("info")}
      >
        <MdPerson />
      </div>

      <div 
        className={`rightsidebar-frame4 ${active === "appt" ? "active" : ""}`}
        onClick={() => setActive("appt")}
      >
        <AiFillExclamationCircle />
      </div>

    </div>
  );
};


export default RightSideBar;