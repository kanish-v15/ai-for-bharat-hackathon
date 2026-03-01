import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LabSamjho from './pages/LabSamjho';
import CareGuide from './pages/CareGuide';
import MedScribe from './pages/MedScribe';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/lab-samjho" element={<LabSamjho />} />
          <Route path="/care-guide" element={<CareGuide />} />
          <Route path="/medscribe" element={<MedScribe />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
