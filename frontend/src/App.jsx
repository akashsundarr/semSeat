import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Allocation from './pages/Allocation';
import ExamSeries from './pages/management/ExamSeries'; // New Import
import ScheduleExam from './pages/management/ScheduleExam'; // New Import

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/allocation" element={<Allocation />} />
          <Route path="/management/exam-series" element={<ExamSeries />} /> {/* New Route */}
          <Route path="/management/schedule-exam" element={<ScheduleExam />} /> {/* New Route */}
          {/* Add routes for other pages here later */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;