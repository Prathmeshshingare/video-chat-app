import { Routes, Route } from "react-router-dom";
import  Homepage  from "./pages/Homepage";
import VideoRoom from "./pages/Room";
import Patient from "./pages/Patient";
import PatientLogin from "./pages/PatientLogin";
import RoleSelect from "./pages/RoleSelect";

function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelect />} />
       <Route path="/doctor" element={<Homepage />} />
      <Route path="/patientl" element={<PatientLogin />} />
      <Route path="/room/:roomId" element={<VideoRoom />} />
      <Route path="/patient/room/:roomId" element={<Patient />} />
    </Routes>
  );
}

export default App;
