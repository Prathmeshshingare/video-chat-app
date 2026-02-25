import React, { useEffect, useState } from "react";
import "./PatientClinicDropDownCss.css";

const PatientClinicDropdown = ({
  selectedPatient,
  setSelectedPatient,
  selectedClinic,
  setSelectedClinic,
  selectedDoctor,
  setSelectedDoctor
}) => {
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors]=useState([]);

  useEffect(() => {
    fetch("http://192.168.10.192:8000/api/patients/")
      .then((res) => res.json())
      .then((data) => setPatients(data));
  }, []);

  useEffect(() => {
    fetch("http://192.168.10.192:8000/api/clinics/")
      .then((res) => res.json())
      .then((data) => setClinics(data));
  }, []);


    useEffect(() => {
    fetch("http://192.168.10.192:8000/api/doctors/")
      .then((res) => res.json())
      .then((data) => setDoctors(data));
  }, []);

  return (
    <div className="dropdown-container">
      <div className="field">
        <label>Patient</label>
        <select
          value={selectedPatient}
          onChange={(e) => setSelectedPatient(e.target.value)}
          className="dropdown"
        >
          <option value="">-- Select Patient --</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.patient_name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Doctor</label>
        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className="dropdown"
        >
          <option value="">-- Select Doctor --</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.doctor_name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Clinic</label>
        <select
          value={selectedClinic}
          onChange={(e) => setSelectedClinic(e.target.value)}
          className="dropdown"
        >
          <option value="">-- Select Clinic --</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.clinic_name}
            </option>
          ))}
        </select>
      </div>


    </div>
  );
};

export default PatientClinicDropdown;
