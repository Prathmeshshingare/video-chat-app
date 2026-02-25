import React from "react";
import { useNavigate } from "react-router-dom";
import './RoleSelection.css'
const RoleSelect = () => {
  const navigate = useNavigate();

  const docHandler = () => {
    navigate("/doctor");
  };
  const patientHandler = () => {
    navigate("/patientl");
  };
  return (
    <div>
      <div className="role-btn-container">
        <h3>Choose Role</h3>
        <button onClick={docHandler}>Doctor</button>
        <button onClick={patientHandler}>Patient</button>
      </div>
    </div>
  );
};

export default RoleSelect;
