import React from "react";
import "./Information.css";
import { FiExternalLink } from "react-icons/fi";
const Information = () => {
  return (
    <div className="info-wrapper">
     <div className="info-header">
  <a
    href="/medical-history"
    className="medical-link"
  >
    <FiExternalLink className="link-icon" />
    Go To Patient’s Medical History
  </a>
</div>

      <div className="info-section">
        <h3>Patient Information</h3>

        <div className="info-card">
          <InfoRow label1="First Name" value="Emilli" />
          <InfoRow label1="Last Name" value="Williams" />
          <InfoRow label1="Sex Assigned At Birth" value="Female" />
          <InfoRow label1="Mobile No." value="+91 76543 12345" />
        </div>
      </div>

      <div className="info-section">
        <h3>Partner Information</h3>

        <div className="info-card">
          <InfoRow label1="First Name" value="John" />
          <InfoRow label1="Last Name" value="Williams" />
          <InfoRow label1="Sex Assigned At Birth" value="Male" />
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label1, value }) => (
  <div className="info-row">
    <span className="label1">{label1}</span>
    <span className="value">{value}</span>
  </div>
);

export default Information;