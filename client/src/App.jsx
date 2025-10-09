import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import ViewAllocation from './pages/ViewAllocation';
import ManagementPage from './pages/Management';
import ExamManagementPage from './pages/ExamManagement';
import ClassroomManager from './pages/ClassroomManager';
import StudentManager from './pages/StudentManager';
import DepartmentManager from './pages/DepartmentManager';

function App() {
  return (
    <Router>
      <div className="bg-gray-50 min-h-screen">
        {/* <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 py-4">
                <h1 className="text-xl font-semibold text-gray-800">SeatPlan Pro 📝</h1>
            </div>
        </header> */}
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/series/:seriesId" element={<Timetable />} />
            <Route path="/allocations/view" element={<ViewAllocation />} />
            <Route path="/manage" element={<ManagementPage />} />
            <Route path="/manage-exams" element={<ExamManagementPage />} />
            <Route path="/manage/classrooms" element={<ClassroomManager />} />
              <Route path="/manage/students" element={<StudentManager />} />
              <Route path="/manage/departments" element={<DepartmentManager />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;