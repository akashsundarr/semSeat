import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/classroomApi'; // We will create this next

// A reusable notification component
const Notification = ({ message, type }) => {
  if (!message) return null;
  const baseClasses = "p-3 rounded-md my-4 text-sm";
  const typeClasses = type === 'success' 
    ? "bg-green-100 text-green-800" 
    : "bg-red-100 text-red-800";
  return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

function ClassroomManager() {
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  
  // State for the form (Add/Edit)
  const [formData, setFormData] = useState({ room_id: '', capacity: '' });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch all classrooms when the component loads
  const fetchClassrooms = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAllClassrooms();
      setClassrooms(data);
    } catch {
      setError('Could not fetch classrooms.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification({ message: '', type: '' });
    try {
      if (isEditing) {
        // Update existing classroom
        await api.updateClassroom(formData.room_id, { capacity: formData.capacity });
        setNotification({ message: 'Classroom updated successfully!', type: 'success' });
      } else {
        // Add new classroom
        await api.addClassroom(formData);
        setNotification({ message: 'Classroom added successfully!', type: 'success' });
      }
      // Reset form and refresh list
      setFormData({ room_id: '', capacity: '' });
      setIsEditing(false);
      fetchClassrooms();
    } catch (err) {
      setNotification({ message: err.message, type: 'error' });
    }
  };

  const handleEdit = (classroom) => {
    setIsEditing(true);
    setFormData({ room_id: classroom.room_id, capacity: classroom.capacity });
  };

  const handleDelete = async (roomId) => {
    if (window.confirm(`Are you sure you want to delete classroom ${roomId}? This cannot be undone.`)) {
      try {
        await api.deleteClassroom(roomId);
        setNotification({ message: 'Classroom deleted successfully!', type: 'success' });
        fetchClassrooms(); // Refresh list
      } catch (err) {
        setNotification({ message: err.message, type: 'error' });
      }
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData({ room_id: '', capacity: '' });
  };

  if (isLoading) return <div className="p-8 text-center">Loading classrooms...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manage Classrooms</h1>
        <Link to="/" className="text-blue-600 hover:underline">&larr; Back to Dashboard</Link>
      </div>
      
      <Notification message={notification.message} type={notification.type} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-2xl font-bold mb-4">{isEditing ? 'Edit Classroom' : 'Add New Classroom'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="room_id" className="block text-sm font-medium">Room ID</label>
                <input
                  type="text"
                  name="room_id"
                  id="room_id"
                  value={formData.room_id}
                  onChange={handleInputChange}
                  placeholder="e.g., R101"
                  required
                  disabled={isEditing}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  id="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="e.g., 42"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                  {isEditing ? 'Update' : 'Add'}
                </button>
                {isEditing && (
                  <button type="button" onClick={cancelEdit} className="w-full px-4 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Table Section */}
        <div className="lg:col-span-2">
           <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-2xl font-bold mb-4">Existing Classrooms</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classrooms.map((room) => (
                    <tr key={room.room_id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{room.room_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{room.capacity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => handleEdit(room)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                        <button onClick={() => handleDelete(room.room_id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default ClassroomManager;