import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTimetable } from '../api/infoApi';
import { runAllocation, checkAllocationStatus } from '../api/allocationsApi';

// Helper function to group exams by a composite key of date and start time
const groupExamsBySession = (exams) => {
  return exams.reduce((acc, exam) => {
    const sessionKey = `${exam.exam_date}_${exam.start_time}`;
    if (!acc[sessionKey]) {
      acc[sessionKey] = {
        date: exam.exam_date,
        time: exam.start_time,
        exams: []
      };
    }
    acc[sessionKey].exams.push(exam);
    return acc;
  }, {});
};


function Timetable() {
  const { seriesId } = useParams();
  const [timetableBySession, setTimetableBySession] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allocationStatus, setAllocationStatus] = useState({});

  // Effect to fetch timetable and then check the status of each session
  useEffect(() => {
    const fetchAndCheckTimetable = async () => {
      if (!seriesId) return;

      try {
        setIsLoading(true);
        // 1. Fetch the timetable data
        const data = await getTimetable(seriesId);
        const groupedData = groupExamsBySession(data);
        setTimetableBySession(groupedData);
        setError(null);
        
        // 2. Asynchronously check the allocation status for each session
        const statusChecks = Object.keys(groupedData).map(sessionKey => {
          const { date, time } = groupedData[sessionKey];
          return checkAllocationStatus(seriesId, date, time).then(statusResult => ({
            key: sessionKey,
            allocated: statusResult.allocated
          }));
        });
        
        const statuses = await Promise.all(statusChecks);
        
        // 3. Populate the initial state of the buttons
        const initialStatus = {};
        statuses.forEach(status => {
          if (status.allocated) {
            initialStatus[status.key] = { success: true, message: 'Allocation is complete.' };
          }
        });
        setAllocationStatus(initialStatus);

      } catch (err) {
        setError('Failed to fetch timetable or check allocation status.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndCheckTimetable();
  }, [seriesId]);

  const handleRunAllocation = async (date, time, sessionKey) => {
    setAllocationStatus(prev => ({ ...prev, [sessionKey]: { loading: true, message: '' } }));
    try {
      const result = await runAllocation(seriesId, date, time);
      setAllocationStatus(prev => ({ 
        ...prev, 
        [sessionKey]: { loading: false, message: result.message, success: true } 
      }));
    } catch (err) {
      setAllocationStatus(prev => ({
        ...prev,
        [sessionKey]: { loading: false, message: 'Allocation failed!', success: false }
      }));
      console.error(err);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading timetable...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-100 rounded-md">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Exam Timetable</h1>
        <Link to="/" className="text-blue-600 hover:underline">&larr; Back to Dashboard</Link>
      </div>

      <div className="space-y-6">
        {Object.keys(timetableBySession).sort().map((sessionKey) => {
          const { date, time, exams } = timetableBySession[sessionKey];
          const sessionStatus = allocationStatus[sessionKey] || {};

          return (
            <div key={sessionKey} className="bg-white p-6 rounded-lg shadow-md border">
              <div className="md:flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">
                      {new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      <span className="ml-4 font-mono text-lg text-gray-600">{time}</span>
                  </h2>
                  <div className="mt-4 md:mt-0 flex items-center space-x-4">
                      {sessionStatus.success ? (
                          <Link 
                              to={`/allocations/view?seriesId=${seriesId}&date=${date}&time=${time}`}
                              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700"
                          >
                              View Allocations
                          </Link>
                      ) : (
                          <button
                              onClick={() => handleRunAllocation(date, time, sessionKey)}
                              disabled={sessionStatus.loading}
                              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                          >
                              {sessionStatus.loading ? 'Allocating...' : 'Run Allocation'}
                          </button>
                      )}
                  </div>
              </div>
              {sessionStatus.message && !sessionStatus.success && (
                  <div className={`text-sm p-3 rounded-md mb-4 ${sessionStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {sessionStatus.message}
                  </div>
              )}
              <ul className="divide-y divide-gray-200">
                {exams.map((exam) => (
                  <li key={exam.exam_id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800">{exam.subject_name} ({exam.dept_code})</p>
                      <p className="text-sm text-gray-500">{exam.subject_code}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Timetable;