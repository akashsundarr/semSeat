import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/classroomApi';
import ConfirmationModal from '../components/ConfirmationModal';

const Notification = ({ message, type }) => {
  if (!message) return null;
  const base = "p-3 rounded-md my-4 text-sm transition shadow";
  const typeCls = type === 'success' ? "bg-accent-50 text-accent-700 border border-accent-200" : "bg-danger-100 text-danger-700 border border-danger-200";
  return <div className={`${base} ${typeCls}`}>{message}</div>;
};

function ClassroomManager() {
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [formData, setFormData] = useState({ room_id: '', capacity: '' });
  const [isEditing, setIsEditing] = useState(false);

  const fetchClassrooms = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAllClassrooms();
      setClassrooms(data);
      setError(null);
    } catch {
      setError("Could not fetch classrooms.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchClassrooms(); }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification({ message: '', type: '' });

    try {
      if (isEditing) {
        await api.updateClassroom(formData.room_id, { capacity: formData.capacity });
        setNotification({ message: "Classroom updated successfully!", type: "success" });
      } else {
        await api.addClassroom(formData);
        setNotification({ message: "Classroom added successfully!", type: "success" });
      }
      setFormData({ room_id: '', capacity: '' });
      setIsEditing(false);
      fetchClassrooms();
    } catch (err) {
      setNotification({ message: err.message || "Failed to save classroom.", type: "error" });
    }
  };

  const handleEdit = (room) => { setIsEditing(true); setFormData(room); };
  const cancelEdit = () => { setIsEditing(false); setFormData({ room_id: '', capacity: '' }); };

  const handleDelete = async (roomId) => {
    if (!window.confirm(`Are you sure you want to delete classroom ${roomId}? This cannot be undone.`)) return;
    try {
      await api.deleteClassroom(roomId);
      setNotification({ message: "Classroom deleted successfully!", type: "success" });
      fetchClassrooms();
    } catch (err) {
      setNotification({ message: err.message || "Failed to delete classroom.", type: "error" });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-600 font-semibold">Loading classrooms...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-semibold">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manage Classrooms</h1>
        <Link to="/" className="text-primary-600 hover:underline">← Back to Dashboard</Link>
      </div>

      <Notification message={notification.message} type={notification.type} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fadeInUp">
          <h2 className="text-2xl font-semibold mb-4">{isEditing ? "Edit Classroom" : "Add New Classroom"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="room_id" className="block text-sm font-medium">Room ID</label>
              <input
                id="room_id"
                name="room_id"
                type="text"
                required
                disabled={isEditing}
                value={formData.room_id}
                onChange={handleInputChange}
                placeholder="e.g., R101"
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
              />
            </div>
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium">Capacity</label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                required
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="e.g., 42"
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
              />
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-900 font-semibold transition"> {isEditing ? "Update" : "Add"}</button>
              {isEditing && (<button type="button" onClick={cancelEdit} className="flex-1 px-4 py-2 bg-gray-500 rounded-md hover:bg-gray-600 text-white font-semibold transition">Cancel</button>)}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fadeInUp">
          <h2 className="text-2xl font-semibold mb-4">Existing Classrooms</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Room ID</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Capacity</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {classrooms.map(room => (
                  <tr key={room.room_id} className="hover:bg-gray-50 cursor-pointer transition">
                    <td className="px-6 py-4 font-medium text-gray-700">{room.room_id}</td>
                    <td className="px-6 py-4 text-gray-600">{room.capacity}</td>
                    <td className="px-6 py-4 text-right space-x-4">
                      <button onClick={() => handleEdit(room)} className="text-primary-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(room.room_id)} className="text-danger-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {opacity: 0; transform: translateY(20px);}
          to {opacity: 1; transform: translateY(0);}
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default ClassroomManager;
