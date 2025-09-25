import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ExamSeries = () => {
  const [seriesList, setSeriesList] = useState([]);
  const [formData, setFormData] = useState({
    series_name: '',
    start_date: '',
    end_date: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Function to fetch all exam series
  const fetchSeries = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/info/exam-series');
      setSeriesList(response.data);
    } catch {
      setError('Failed to fetch exam series.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the data when the component mounts
  useEffect(() => {
    fetchSeries();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.series_name || !formData.start_date || !formData.end_date) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setSuccessMessage('');

    try {
      await api.post('/management/exam-series', formData);
      setSuccessMessage('Exam series created successfully!');
      // Reset form and refresh the list
      setFormData({ series_name: '', start_date: '', end_date: '' });
      fetchSeries();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create exam series.');
    }
  };

  return (
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 px-4 sm:px-0">Manage Exam Series</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Create New Series</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="series_name" className="block text-sm font-medium text-gray-700">Series Name</label>
                  <input type="text" name="series_name" id="series_name" value={formData.series_name} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="e.g., First Series - Sep 2025" />
                </div>
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input type="date" name="start_date" id="start_date" value={formData.start_date} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">End Date</label>
                  <input type="date" name="end_date" id="end_date" value={formData.end_date} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                </div>
              </div>
              <button type="submit" className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">Create Series</button>
              {successMessage && <p className="text-green-600 mt-2">{successMessage}</p>}
              {error && <p className="text-red-600 mt-2">{error}</p>}
            </form>
          </div>
        </div>

        {/* Series List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {isLoading ? (
                <li className="p-4 text-center">Loading...</li>
              ) : (
                seriesList.map(series => (
                  <li key={series.series_id} className="p-4">
                    <p className="font-semibold text-gray-800">{series.series_name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(series.start_date).toLocaleDateString()} - {new Date(series.end_date).toLocaleDateString()}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ExamSeries;