import React from "react";
import "./Appointment.css";
const Appointment = () => {
  return (
    <div>
      <div className="Appointment-container">
        <div className="Appointment-info-container">
          <div className="text-box">
            <p className="textb">Department:</p>
            <p className="textr">Admin</p>
          </div>
          <div className="text-box">
            <p className="textb">Appointment Type:</p>
            <p className="textr">Video Consultation</p>
          </div>
          <div className="text-box">
            <p className="textb">Personnel:</p>
            <p className="textr">Dr. Jonh Wick</p>
          </div>
          <div className="text-box">
            <p className="textb">Personnel:</p>
            <p className="textr">Dr. Jonh Wick</p>
          </div>
          <div className="text-box">
            <p className="textb">Appointment Reason:</p>
            <p className="textr">Other</p>
          </div>
          <div className="text-box">
            <p className="textb">Date:</p>
            <p className="textr">12/01/2026</p>
          </div>
          <div className="text-box">
            <p className="textb">Remark:</p>
            <p className="textr">
              Appointment booked for routine fertility consultation.
            </p>
          </div>
        </div>
      </div>
    
    </div>
  );
};

export default Appointment;
