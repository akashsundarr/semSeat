import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ScheduleExam = () => {
  const [seriesList, setSeriesList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [formData, setFormData] = useState({
    series_id: '',
    subject_id: '',
    exam_date: '',
    start_time: '',
    end_time: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch initial data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [seriesRes, subjectsRes] = await Promise.all([
          api.get('/info/exam-series'),
          api.get('/info/subjects') // Uses the new endpoint we added
        ]);
        setSeriesList(seriesRes.data);
        setSubjectList(subjectsRes.data);
        // Set default selections
        if (seriesRes.data.length > 0) {
          setFormData(prev => ({ ...prev, series_id: seriesRes.data[0].series_id }));
        }
        if (subjectsRes.data.length > 0) {
          setFormData(prev => ({ ...prev, subject_id: subjectsRes.data[0].subject_id }));
        }
      } catch {
        setError('Failed to load necessary data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.values(formData).some(value => !value)) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setSuccessMessage('');

    try {
      await api.post('/management/scheduled-exam', formData);
      setSuccessMessage('Exam has been scheduled successfully!');
      // Optionally reset form
      setFormData(prev => ({
        ...prev,
        exam_date: '',
        start_time: '',
        end_time: '',
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to schedule exam.');
    }
  };

  if (isLoading) {
    return <main className="max-w-4xl mx-auto py-6 px-4">Loading form...</main>;
  }

  return (
    <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Schedule New Exam</h1>
      <div className="bg-white p-8 rounded-lg shadow">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="series_id" className="block text-sm font-medium text-gray-700">Exam Series</label>
              <select name="series_id" id="series_id" value={formData.series_id} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                {seriesList.map(s => <option key={s.series_id} value={s.series_id}>{s.series_name}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="subject_id" className="block text-sm font-medium text-gray-700">Subject</label>
              <select name="subject_id" id="subject_id" value={formData.subject_id} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                {subjectList.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_code} - {s.subject_name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="exam_date" className="block text-sm font-medium text-gray-700">Exam Date</label>
                <input type="date" name="exam_date" id="exam_date" value={formData.exam_date} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">Start Time</label>
                <input type="time" name="start_time" id="start_time" value={formData.start_time} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">End Time</label>
                <input type="time" name="end_time" id="end_time" value={formData.end_time} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
              </div>
            </div>
          </div>

          <button type="submit" className="mt-8 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">Schedule Exam</button>
          
          {successMessage && <p className="text-green-600 mt-4 text-center">{successMessage}</p>}
          {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
        </form>
      </div>
    </main>
  );
};

export default ScheduleExam;