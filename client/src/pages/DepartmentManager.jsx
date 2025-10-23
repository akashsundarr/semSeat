import React, { useState, useEffect } from "react";
import {
  getDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
} from "../api/departmentApi";
import ManagementForm from "../components/ManagementForm";
import ConfirmationModal from "../components/ConfirmationModal";

const Notification = ({ message, type }) => {
  if (!message) return null;
  const base = "p-3 rounded-md my-4 text-sm transition shadow";
  const typeClasses =
    type === "success"
      ? "bg-accent-50 text-accent-700 border border-accent-200"
      : "bg-danger-100 text-danger-700 border border-danger-200";
  return <div className={`${base} ${typeClasses}`}>{message}</div>;
};

function DepartmentManager() {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [deletingDepartmentId, setDeletingDepartmentId] = useState(null);

  const departmentFields = [
    { name: "dept_name", label: "Department Name", type: "text", placeholder: "e.g., Computer Science" },
    { name: "dept_code", label: "Department Code", type: "text", placeholder: "e.g., CSE" },
  ];

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const data = await getDepartments();
      setDepartments(data);
      setError(null);
    } catch {
      setError("Failed to fetch departments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

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

  const handleFormSubmit = async (formData) => {
    try {
      let result;
      if (editingDepartment) {
        result = await updateDepartment(editingDepartment.dept_id, formData);
      } else {
        result = await addDepartment(formData);
      }
      setNotification({ message: result.message, type: "success" });
      fetchDepartments();
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
    } finally {
      setIsFormModalOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const result = await deleteDepartment(deletingDepartmentId);
      setNotification({ message: result.message, type: "success" });
      fetchDepartments();
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingDepartmentId(null);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-600 font-semibold">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-semibold">{error}</div>;

  return (
    <>
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
          <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <button onClick={() => setIsFormModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold">
              &times;
            </button>
            <ManagementForm title={editingDepartment ? "Edit Department" : "Add Department"} fields={departmentFields} onSubmit={handleFormSubmit} initialData={editingDepartment} />
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
      >
        <p>
          Are you sure you want to delete this department? This could affect existing students and subjects.
        </p>
      </ConfirmationModal>

      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Manage Departments</h1>
          <button onClick={handleOpenAddModal} className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-900 transition">
            Add New Department
          </button>
        </div>

        <Notification message={notification.message} type={notification.type} />

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 overflow-auto max-h-[70vh] animate-fadeInUp">
          <ul className="divide-y divide-gray-200">
            {departments.map((dept) => (
              <li key={dept.dept_id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">{dept.dept_name}</p>
                  <p className="text-sm text-gray-500">{dept.dept_code}</p>
                </div>
                <div className="space-x-2">
                  <button onClick={() => handleOpenEditModal(dept)} className="px-3 py-1 bg-gray-600 text-white text-xs font-semibold rounded-md hover:bg-black">
                    Edit
                  </button>
                  <button onClick={() => handleOpenDeleteModal(dept.dept_id)} className="px-3 py-1 bg-gray-500 text-white text-xs font-semibold rounded-md hover:bg-black">
                    Delete
                  </button>
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
