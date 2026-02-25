import React from "react";
import "./Information.css";
//import { AiOutlineExport } from "react-icons/ai";
const Information = () => {
  return (
    <div>
      <div>
       
        <div className="Info-container">
        
          <div className="patient-info-container">
           <div className="export-box">
            <p className="clickable-text">
              Go To Patient’s Medical History
            </p>
            </div>
            Patient Information
            <div className="info-container">
              <div className="text-div">
                <p className="textp1">First Name:</p>
                <p className="textp2">Emilli</p>
              </div>
              <div className="text-div">
                <p className="textp1">Last Name :</p>
                <p className="textp2">Williams</p>
              </div>
              <div className="text-div">
                <p className="textp1">Sex Assigned At Birth :</p>
                <p className="textp2">Female</p>
              </div>
              <div className="text-div">
                <p className="textp1">Mobile No. :</p>
                <p className="textp2">+91 76543 12345</p>
              </div>
              <div>
                <br></br>
                <p>Partner Information</p>
                <div className="partner-info">
                  <div className="text-div">
                    <p className="textp1">First Name:</p>
                    <p className="textp2">Emilli</p>
                  </div>
                  <div className="text-div">
                    <p className="textp1">Last Name :</p>
                    <p className="textp2">Williams</p>
                  </div>
                  <div className="text-div">
                    <p className="textp1">Sex Assigned At Birth :</p>
                    <p className="textp2">Female</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Information;
