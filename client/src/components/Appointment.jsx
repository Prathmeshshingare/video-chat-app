import React from "react";
import "./Appointment.css";

const Appointment = () => {
  return (
    <div className="appointment-wrapper">
      <h3 className="appointment-title">Appointment Details</h3>

      <div className="appointment-card">
        <AppointmentRow labelinfo="Department" value="Admin" />
        <AppointmentRow labelinfo="Appointment Type" value="Video Consultation" />
        <AppointmentRow labelinfo="Personnel" value="Dr. John Wick" />
        <AppointmentRow labelinfo="Appointment Reason" value="Other" />
        <AppointmentRow labelinfo="Date" value="12/01/2026" />
        <AppointmentRow
          labelinfo="Remark"
          value="Appointment booked for routine fertility consultation."
          isLong
        />
      </div>
    </div>
  );
};

const AppointmentRow = ({ labelinfo, value, isLong }) => (
  <div className={`appointment-row ${isLong ? "long" : ""}`}>
    <span className="appointment-label">{labelinfo}</span>
    <span className="appointment-value">{value}</span>
  </div>
);

export default Appointment;