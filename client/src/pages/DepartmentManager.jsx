import React, { useState, useEffect } from 'react';
import { getDepartments, addDepartment, updateDepartment, deleteDepartment } from '../api/departmentApi';
import ManagementForm from '../components/ManagementForm';
import ConfirmationModal from '../components/ConfirmationModal';

// A small, reusable notification component
const Notification = ({ message, type }) => {
    if (!message) return null;
    const baseClasses = "p-3 rounded-md my-4 text-sm";
    const typeClasses = type === 'success' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
    return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

function DepartmentManager() {
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // State for managing modals
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [deletingDepartmentId, setDeletingDepartmentId] = useState(null);
    
    // Form fields definition
    const departmentFields = [
        { name: 'dept_name', label: 'Department Name', type: 'text', placeholder: 'e.g., Computer Science' },
        { name: 'dept_code', label: 'Department Code', type: 'text', placeholder: 'e.g., CSE' },
    ];

    // Function to fetch all departments
    const fetchDepartments = async () => {
        try {
            setIsLoading(true);
            const data = await getDepartments();
            setDepartments(data);
        } catch  {
            setError('Failed to fetch departments.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    // Handlers for opening modals
    const handleOpenAddModal = () => {
        setEditingDepartment(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (dept) => {
        setEditingDepartment(dept);
        setIsFormModalOpen(true);
    };

    const handleOpenDeleteModal = (id) => {
        setDeletingDepartmentId(id);
        setIsDeleteModalOpen(true);
    };

    // Handler for form submission (both add and edit)
    const handleFormSubmit = async (formData) => {
        try {
            let result;
            if (editingDepartment) {
                result = await updateDepartment(editingDepartment.dept_id, formData);
            } else {
                result = await addDepartment(formData);
            }
            setNotification({ message: result.message, type: 'success' });
            fetchDepartments(); // Re-fetch the list to show changes
        } catch (err) {
            setNotification({ message: err.message, type: 'error' });
        } finally {
            setIsFormModalOpen(false);
        }
    };

    // Handler for deleting a department
    const handleDeleteConfirm = async () => {
        try {
            const result = await deleteDepartment(deletingDepartmentId);
            setNotification({ message: result.message, type: 'success' });
            fetchDepartments(); // Re-fetch the list
        } catch (err) {
            setNotification({ message: err.message, type: 'error' });
        } finally {
            setIsDeleteModalOpen(false);
            setDeletingDepartmentId(null);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500 bg-red-100 rounded-md">{error}</div>;

    return (
        <>
            {isFormModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
                    <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <button onClick={() => setIsFormModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">&times;</button>
                        <ManagementForm
                            title={editingDepartment ? "Edit Department" : "Add Department"}
                            fields={departmentFields}
                            onSubmit={handleFormSubmit}
                            initialData={editingDepartment}
                        />
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Department"
            >
                <p>Are you sure you want to delete this department? This could affect existing students and subjects.</p>
            </ConfirmationModal>

            <div className="container mx-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Manage Departments</h1>
                    <button onClick={handleOpenAddModal} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                        Add New Department
                    </button>
                </div>
                <Notification message={notification.message} type={notification.type} />
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <ul className="divide-y divide-gray-200">
                        {departments.map((dept) => (
                            <li key={dept.dept_id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-900">{dept.dept_name}</p>
                                    <p className="text-sm text-gray-500">{dept.dept_code}</p>
                                </div>
                                <div className="space-x-2">
                                    <button onClick={() => handleOpenEditModal(dept)} className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-md hover:bg-yellow-600">Edit</button>
                                    <button onClick={() => handleOpenDeleteModal(dept.dept_id)} className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700">Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}

export default DepartmentManager;