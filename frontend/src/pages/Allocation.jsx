import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Use the central API service

const Allocation = () => {
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Defaults to today
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Fetch the list of exam series when the component loads
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const response = await api.get('/info/exam-series');
        setSeriesList(response.data);
        if (response.data.length > 0) {
          setSelectedSeries(response.data[0].series_id); // Default to the latest series
        }
      } catch (err) {
        setError('Failed to load exam series.');
        console.error(err);
      }
    };
    fetchSeries();
  }, []);

  const handleRunAllocation = async (e) => {
    e.preventDefault();
    if (!selectedSeries || !selectedDate) {
      setError('Please select both an exam series and a date.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      console .log('Running allocation with:', { series_id: selectedSeries, allocation_date: selectedDate }); 
      const response = await api.post('/allocations/run-allocation', {
        series_id: selectedSeries,
        allocation_date: selectedDate,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An unexpected error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Run Seat Allocation ⚙️</h1>
        
        <div className="bg-white p-8 rounded-lg shadow">
          <form onSubmit={handleRunAllocation}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Exam Series Dropdown */}
              <div>
                <label htmlFor="series" className="block text-sm font-medium text-gray-700">
                  Exam Series
                </label>
                <select
                  id="series"
                  value={selectedSeries}
                  onChange={(e) => setSelectedSeries(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  {seriesList.map((series) => (
                    <option key={series.series_id} value={series.series_id}>
                      {series.series_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Picker */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Allocation Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-4 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              >
                {loading ? 'Running Allocation...' : 'Run Allocation'}
              </button>
            </div>
          </form>

          {/* Result/Error Display */}
          <div className="mt-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {result && (
               <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md" role="alert">
                 <p><strong className="font-bold">Success! </strong> {result.message}</p>
                 <p>Students Assigned: {result.students_assigned}</p>
                 <p>Students Unassigned: {result.unassigned_count}</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Allocation;