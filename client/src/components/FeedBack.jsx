import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { MdCallEnd } from "react-icons/md";
import "./FeedBack.css";

const FeedBack = ({ navigateTo ,previousView}) => {

  const [rating, setRating]=useState(0);
   const location = useLocation();
  const callDuration = location.state?.duration || "00:00";
  return (
    <div className="feedback-overlay">
      <div className="feedback-modal">

        {/* Header */}
        <div className="header-section">
          <div className="call-icon">
            <MdCallEnd   onClick={() => navigateTo(previousView)} />
          </div>
          <h3>Call Ended</h3>
          <div className="duration-pill">
            Call Duration : <span>{callDuration}</span>
          </div>
        </div>

        {/* AI Summary */}
        <div className="summary-box">
          <h4>AI Call Summary</h4>
          <ul>
            <li>Today's consultation focused on understanding your menstrual cycle pattern.</li>
            <li>You shared that your periods have been slightly irregular with mild discomfort.</li>
          </ul>
        </div>

        {/* Rating Section */}
        <div className="feedback-section">
          <p>How satisfied are you with your consultation today?</p>
         <div className="stars">
  {[1, 2, 3, 4, 5].map((star) => (
    <span
      key={star}
      onClick={() => setRating(star)}
      style={{
        cursor: "pointer",
        fontSize: "28px",
        color: star <= rating ? "#FFD700" : "#ccc",
        transition: "0.2s"
      }}
    >
      ★
    </span>
  ))}
</div>

          <p>Did the doctor address your concerns clearly?</p>
          <div className="radio-group">
            <label><input type="radio" name="clarity" />completely</label>
            <label><input type="radio" name="clarity" /> Partially</label>
            <label><input type="radio" name="clarity" /> No</label>
          </div>

          <p>Would you like to share additional feedback? <span className="optional">(Optional)</span></p>
          <textarea placeholder="Share your experience or suggestions..."></textarea>
        </div>

        {/* Submit */}
        <div className="submit-wrapper">
          <button className="submit-btn">Submit Feedback</button>
        </div>

      </div>
    </div>
  );
};

export default FeedBack;