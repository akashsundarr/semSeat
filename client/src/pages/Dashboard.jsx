import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getExamSeries } from '../api/infoApi';
import { resetAllAllocations } from '../api/allocationsApi';
import ConfirmationModal from '../components/ConfirmationModal';

// A small, reusable notification component for showing status messages
const Notification = ({ message, type }) => {
  if (!message) return null;
  const baseClasses = "p-3 rounded-md my-4 text-sm";
  const typeClasses = type === 'success' 
    ? "bg-green-100 text-green-800" 
    : "bg-red-100 text-red-800";
  return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

function Dashboard() {
  const [seriesList, setSeriesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State to manage the reset process
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState({ message: '', type: '' });

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setIsLoading(true);
        const data = await getExamSeries();
        setSeriesList(data);
        setError(null);
      } catch  {
        setError('Failed to fetch exam series. Is the backend server running?');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSeries();
  }, []);

  // Handler to perform the reset after confirmation
  const handleResetConfirm = async () => {
    setIsResetting(true);
    setResetStatus({ message: '', type: '' }); // Clear previous messages
    try {
      const result = await resetAllAllocations();
      setResetStatus({ message: result.message, type: 'success' });
    } catch (err) {
      setResetStatus({ message: err.message, type: 'error' });
    } finally {
      setIsResetting(false);
      setIsModalOpen(false); // Close the modal
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-100 rounded-md">{error}</div>;

  return (
    <>
      {/* The Confirmation Modal component */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleResetConfirm}
        title="Reset All Allocations"
      >
        <p>Are you sure? This will permanently delete all seating arrangements and reset every student's status. This action cannot be undone.</p>
      </ConfirmationModal>

      <div className="container mx-auto p-4 md:p-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Exam Dashboard</h1>
          {/* Main navigation for all management pages */}
          <div className="flex flex-wrap items-center gap-2">
              <Link to="/manage/students" className="px-3 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-800 text-xs sm:text-sm">Manage Students</Link>
              <Link to="/manage/classrooms" className="px-3 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-800 text-xs sm:text-sm">Manage Classrooms</Link>
              <Link to="/manage/departments" className="px-3 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-800 text-xs sm:text-sm">Manage Departments</Link>
              <Link to="/manage-exams" className="px-3 py-2 bg-blue-700 text-white font-semibold rounded-md hover:bg-blue-800 text-xs sm:text-sm">Manage Exams</Link>
              <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={isResetting}
                  className="px-3 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:bg-red-400 transition-colors text-xs sm:text-sm"
              >
                  {isResetting ? 'Resetting...' : 'Reset All'}
              </button>
          </div>
        </div>
        
        {/* The area to display success or error messages after resetting */}
        <Notification message={resetStatus.message} type={resetStatus.type} />

        <p className="text-gray-600 mb-8">Select an exam series to view the timetable and run allocations.</p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {seriesList.length > 0 ? (
            seriesList.map((series) => (
              <Link
                to={`/series/${series.series_id}`}
                key={series.series_id}
                className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 transition-all duration-200"
              >
                <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">
                  {series.series_name}
                </h5>
              </Link>
            ))
          ) : (
            <p className="text-gray-500">No exam series found.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;