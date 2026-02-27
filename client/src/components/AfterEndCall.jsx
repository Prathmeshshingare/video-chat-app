import React from "react";
import "./AfterEndCall.css";
import { MdCallEnd } from "react-icons/md";
import {MdCancel} from 'react-icons/md';
const AfterEndCall = ({ setIsCallEnded ,  navigateTo }) => {
  return (
    <div className="outer-endcall-box-container">
      <div className="outer-box">
        <div className="cut-icon"><MdCancel/></div>
        <div className="end-call-info-time">
          <div className="endcall-icon">
            <MdCallEnd />
          </div>
          <div className="callend-heading">
            <h5>Call Ended</h5>
          </div>
          <div className="time-duration">
            <p style={{ fontWeight: 20, fontSize: 14 }}>Call Duration:</p>
            <p>08:00</p>
          </div>
        </div>
        <div className="inner-endcall-box">
          <div className="title">
            <h4 className="title-h4">Ai Call Summary</h4>
            <ul className="points">
              <li>Patient discussed menstrual history</li>
              <li>Consectetur adipisicing elit. Placeat, dolores. Lorem ipsum dolor sit.p-0</li>
              <li>Doctor adviced furthre evalution</li>
              <li>Ni intermenstruak bleeding observed</li>
            </ul>
          </div>
        </div>
        <div  className="button-group" style={{display:'flex' , justifyContent:'space-between' , marginTop:'26px'}}>
            <button className="btns"  onClick={() =>  navigateTo("transcript")}>View Transcript</button>
            <button className="btns">✨Scan Transcript for Ai Insights</button>
            <button className="btns"  onClick={() =>  navigateTo("feedback")}>Ask for Feedback</button>
        </div>
      </div>
    </div>
  );
};

export default AfterEndCall;
