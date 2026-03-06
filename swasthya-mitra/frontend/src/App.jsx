import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingLayout from './components/LandingLayout';
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import LabSamjho from './pages/LabSamjho';
import CareGuide from './pages/CareGuide';
import MedScribe from './pages/MedScribe';
import PatientView from './pages/PatientView';
import HealthTimeline from './pages/HealthTimeline';
import ProfileSetup from './pages/ProfileSetup';
import Profile from './pages/Profile';
import LoginModal from './components/LoginModal';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { showLogin } = useAuth();

  return (
    <BrowserRouter>
      {showLogin && <LoginModal />}
      <Routes>
        {/* Landing page - full width, navbar + footer */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<Home />} />
        </Route>

        {/* App pages - sidebar layout */}
        <Route element={<AppLayout />}>
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/lab-samjho" element={<LabSamjho />} />
          <Route path="/care-guide" element={<CareGuide />} />
          <Route path="/medscribe" element={<MedScribe />} />
          <Route path="/medscribe/patient/:id" element={<PatientView />} />
          <Route path="/health-timeline" element={<HealthTimeline />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
