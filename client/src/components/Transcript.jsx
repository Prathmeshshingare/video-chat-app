import React, { useEffect, useRef } from "react";
import "./Transcript.css";

const Transcript = ({ notes }) => {
  const scrollRef = useRef(null);

  // Auto scroll to bottom when notes update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  return (
    <div className="Transcript-container">
      <div className="conv-container">
        <div className="text-container" ref={scrollRef}>
          {notes ? (
           notes.split("\n").map((line, index) => {
  const isDoctor = line.startsWith("Doctor:");
  const isPatient = line.startsWith("Patient:");

  return (
    <div
      key={index}
      className={`transcript-line ${
        isDoctor ? "doctor-line" : isPatient ? "patient-line" : ""
      }`}
    >
      {line}
    </div>
  );
})
          ) : (
            <p className="placeholder-text">
              Live conversation transcript will appear here...
            </p>
          )}
        </div>

        <div className="bottom-elipse"></div>
      </div>
    </div>
  );
};

export default Transcript;