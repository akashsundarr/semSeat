import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Use the central API service

// --- Icon Components ---
const UsersIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 013 1.803M15 21a9 9 0 10-9-9" /></svg> );
const BuildingOfficeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0v-4m6 4v-4m6 4v-4m-9-14V3m6 2V3m6 2V3" /></svg> );
const CalendarDaysIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> );
const CheckBadgeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> );

// --- Main Dashboard Component ---
const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    availableRooms: 0,
    activeSeries: "Loading...",
    studentsAssigned: 0,
  });
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [roomsRes, seriesRes] = await Promise.all([
          api.get('/info/rooms'),
          api.get('/info/exam-series')
        ]);

        const latestSeries = seriesRes.data[0];
        let timetable = [];
        if (latestSeries) {
            const timetableRes = await api.get(`/info/timetable/${latestSeries.series_id}`);
            timetable = timetableRes.data;
        }

        setStats({
          totalStudents: 480, // Placeholder - requires new backend endpoint
          availableRooms: roomsRes.data.length,
          activeSeries: latestSeries ? latestSeries.series_name : "N/A",
          studentsAssigned: 0, // Placeholder - requires new backend endpoint
        });
        
        setUpcomingExams(timetable.slice(0, 3));

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome, Admin! 👋</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Students" value={loading ? '...' : stats.totalStudents} icon={<UsersIcon />} />
          <StatCard title="Available Rooms" value={loading ? '...' : stats.availableRooms} icon={<BuildingOfficeIcon />} />
          <StatCard title="Active Exam Series" value={loading ? '...' : stats.activeSeries} icon={<CalendarDaysIcon />} />
          <StatCard title="Students Assigned" value={loading ? '...' : stats.studentsAssigned} icon={<CheckBadgeIcon />} />
        </div>

        {/* Primary Actions */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
           <ActionButton title="Run Today's Allocation" description="Assign seats for all exams scheduled for today." />
           <ActionButton title="View Full Timetable" description="See the complete schedule for the current series." />
        </div>

        {/* Upcoming Exams List */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Exams</h2>
          <div className="bg-white shadow rounded-lg overflow-hidden">
             {loading ? (
               <p className="p-6 text-center text-gray-500">Loading exams...</p>
             ) : (
              <ul className="divide-y divide-gray-200">
                {upcomingExams.map((exam) => (
                   <li key={exam.exam_id} className="px-6 py-4 flex items-center justify-between">
                     <div>
                       <p className="font-semibold text-indigo-600">{exam.subject_code} - {exam.subject_name}</p>
                       <p className="text-sm text-gray-500">{new Date(exam.exam_date).toLocaleDateString()} @ {exam.start_time}</p>
                     </div>
                     <span className="text-sm font-medium bg-blue-100 text-blue-800 py-1 px-3 rounded-full">Scheduled</span>
                   </li>
                ))}
              </ul>
             )}
          </div>
        </div>
      </div>
    </main>
  );
};

// --- Helper Components for the Dashboard ---
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5 flex items-center">
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-5 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <dd className="text-lg font-semibold text-gray-900">{value}</dd>
        </dl>
      </div>
    </div>
  </div>
);

const ActionButton = ({ title, description }) => (
  <button className="bg-white text-left p-6 shadow rounded-lg hover:shadow-lg transition-shadow duration-300">
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <p className="mt-1 text-sm text-gray-600">{description}</p>
  </button>
);

export default Dashboard;