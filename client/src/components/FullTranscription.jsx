import React from "react";
import { MdClose } from "react-icons/md";
import "./FullTranscription.css";

const  FullTranscription = ({ navigateTo }) => {
  return (
    <div className="ai-overlay">
      <div className="ai-modal">

        {/* Header */}
        <div className="ai-header">
          <h3>AI Clinical Extraction</h3>
          <MdClose 
            className="close-icon"
            onClick={() =>navigateTo("end")}
          />
        </div>

        {/* Conversation Box */}
        <div className="ai-content">
          <p><strong>Dr. Smith :</strong> Hi, I'd like to ask you a few questions about your menstrual history.</p>
          <p><strong>Patient :</strong> Sure doctor.</p>
          <p><strong>Dr. Smith :</strong> At what age did you get your first period?</p>
          <p><strong>Patient :</strong> I was around 13 years old.</p>
          <p><strong>Dr. Smith :</strong> When was your last menstrual period?</p>
          <p><strong>Patient :</strong> My last period started on 12th January 2026.</p>
          <p><strong>Dr. Smith :</strong> Are your cycles regular or irregular?</p>
          <p><strong>Patient :</strong> They are quite irregular. Sometimes I get periods after 40 to 50 days.</p>
          <p><strong>Dr. Smith :</strong> So roughly your cycle length is around 45 days?</p>
          <p><strong>Patient :</strong> Yes doctor, around that.</p>
          <p><strong>Dr. Smith :</strong> How many days does your bleeding usually last?</p>
          <p><strong>Patient :</strong> Around 5 days.</p>
        </div>

        {/* Bottom Button */}
        <div className="ai-footer">
          <button className="scan-btn">
            ✨ Scan for AI Insights
          </button>
        </div>

      </div>
    </div>
  );
};

export default FullTranscription;