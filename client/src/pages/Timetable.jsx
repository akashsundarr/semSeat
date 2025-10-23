import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTimetable } from '../api/infoApi';
import { runAllocation, checkAllocationStatus } from '../api/allocationsApi';

const groupExamsBySession = (exams) => {
  return exams.reduce((acc, exam) => {
    const sessionKey = `${exam.exam_date}_${exam.start_time}`;
    if (!acc[sessionKey]) {
      acc[sessionKey] = {
        date: exam.exam_date,
        time: exam.start_time,
        exams: [],
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

  useEffect(() => {
    const fetchAndCheckTimetable = async () => {
      if (!seriesId) return;
      try {
        setIsLoading(true);
        const data = await getTimetable(seriesId);
        const groupedData = groupExamsBySession(data);
        setTimetableBySession(groupedData);
        setError(null);

        const statusChecks = Object.keys(groupedData).map(sessionKey => {
          const { date, time } = groupedData[sessionKey];
          return checkAllocationStatus(seriesId, date, time).then(statusResult => ({
            key: sessionKey,
            allocated: statusResult.allocated,
          }));
        });

        const statuses = await Promise.all(statusChecks);
        const initialStatus = {};
        statuses.forEach((status) => {
          if (status.allocated) {
            initialStatus[status.key] = { success: true, message: 'Allocation is complete.' };
          }
        });

        setAllocationStatus(initialStatus);
      } catch (err) {
        setError('Failed to fetch timetable or check allocation status.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndCheckTimetable();
  }, [seriesId]);

  const handleRunAllocation = async (date, time, sessionKey) => {
    setAllocationStatus(prev => ({
      ...prev,
      [sessionKey]: { loading: true, message: '' },
    }));

    try {
      const result = await runAllocation(seriesId, date, time);
      setAllocationStatus(prev => ({
        ...prev,
        [sessionKey]: { loading: false, message: result.message, success: true },
      }));
    } catch (err) {
      setAllocationStatus(prev => ({
        ...prev,
        [sessionKey]: { loading: false, message: 'Allocation failed!', success: false },
      }));
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-700 font-semibold">Loading timetable...</div>;
  if (error) return <div className="p-8 text-center text-red-600 bg-red-100 rounded-md">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="flex items-center justify-between mb-6 animate-fadeInDown">
        <h1 className="text-3xl font-bold text-gray-800">Exam Timetable</h1>
        <Link to="/" className="text-gray-700 hover:underline">&larr; Back to Dashboard</Link>
      </div>

      <div className="space-y-6">
        {Object.keys(timetableBySession).sort().map(sessionKey => {
          const { date, time, exams } = timetableBySession[sessionKey];
          const sessionStatus = allocationStatus[sessionKey] || {};

          return (
            <div key={sessionKey} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fadeInUp">
              <div className="md:flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">
                  {new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  <span className="ml-4 font-mono text-lg text-gray-600">{time}</span>
                </h2>
                <div className="mt-4 md:mt-0 flex items-center space-x-4">
                  {sessionStatus.success ? (
                    <Link
                      to={`/allocations/view?seriesId=${seriesId}&date=${date}&time=${time}`}
                      className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition"
                    >View Allocations</Link>
                  ) : (
                    <button
                      onClick={() => handleRunAllocation(date, time, sessionKey)}
                      disabled={sessionStatus.loading}
                      className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-900 disabled:bg-gray-400 transition"
                    >{sessionStatus.loading ? 'Allocating...' : 'Run Allocation'}</button>
                  )}
                </div>
              </div>
              {sessionStatus.message && !sessionStatus.success && (
                <div className="text-sm p-3 rounded-md mb-4 bg-red-100 text-red-800">{sessionStatus.message}</div>
              )}
              <ul className="divide-y divide-gray-200">
                {exams.map(exam => (
                  <li key={exam.exam_id} className="py-3 flex justify-between items-center animate-fadeInUp">
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

      <style>{`
        @keyframes fadeInDown {
          from {opacity: 0; transform: translateY(-20px);}
          to {opacity: 1; transform: translateY(0);}
        }
        @keyframes fadeInUp {
          from {opacity: 0; transform: translateY(20px);}
          to {opacity: 1; transform: translateY(0);}
        }
        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out forwards;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default Timetable;
