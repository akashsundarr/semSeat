import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import * as studentApi from "../api/studentApi";
import { getDepartments } from "../api/infoApi";
import ManagementForm from "../components/ManagementForm";
import ConfirmationModal from "../components/ConfirmationModal";
import BulkImport from "../components/BulkImport";

function StudentManager() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // State for modals
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudentId, setDeletingStudentId] = useState(null);

  // Fetch initial data (students and departments)
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [studentsData, deptsData] = await Promise.all([
        studentApi.getStudents(),
        getDepartments(),
      ]);
      setStudents(studentsData);
      setDepartments(deptsData);
    } catch {
      setError(
        "Failed to fetch the student data. Is the backend server running?"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormSubmit = async (formData) => {
    try {
      let result;
      if (editingStudent) {
        result = await studentApi.updateStudent(
          editingStudent.student_id,
          formData
        );
      } else {
        result = await studentApi.addStudent(formData);
      }
      setNotification({ message: result.message, type: "success" });
      setEditingStudent(null); // Close edit modal
      fetchData(); // Refresh the student list
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const result = await studentApi.deleteStudent(deletingStudentId);
      setNotification({ message: result.message, type: "success" });
      setDeletingStudentId(null); // Close confirmation modal
      fetchData(); // Refresh the list
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
    }
  };

  const handleBulkImport = async (studentsToImport) => {
    // This function is passed to the BulkImport component
    try {
      const result = await studentApi.bulkAddStudents(studentsToImport);
      setNotification({ message: result.message, type: "success" });
      fetchData(); // Refresh the list
    } catch (err) {
      // Re-throw the error so the child component can display it
      throw new Error(err.message || "Bulk import failed.");
    }
  };

  const departmentOptions = departments.map((d) => ({
    value: d.dept_id,
    label: d.dept_name,
  }));

  const studentFormFields = [
    {
      name: "student_id",
      label: "Student ID",
      type: "text",
      placeholder: "e.g., CEC24CS001",
      disabledOnEdit: true,
    },
    {
      name: "name",
      label: "Full Name",
      type: "text",
      placeholder: "Student Name",
    },
    {
      name: "batch",
      label: "Batch",
      type: "text",
      placeholder: "e.g., 2024-2028",
    },
    {
      name: "semester",
      label: "Semester",
      type: "number",
      placeholder: "e.g., 3",
    },
    {
      name: "dept_id",
      label: "Department",
      type: "select",
      options: departmentOptions,
    },
  ];

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <>
      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
          <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
            >
              &times;
            </button>
            <BulkImport
              onImport={handleBulkImport}
              onComplete={() => setIsImportModalOpen(false)}
            />
          </div>
        </div>
      )}
      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Edit Student</h2>
            <ManagementForm
              title="Student"
              fields={studentFormFields}
              onSubmit={handleFormSubmit}
              initialData={editingStudent}
              submitButtonText="Update Student"
            />
            <button
              onClick={() => setEditingStudent(null)}
              className="mt-4 w-full text-center py-2 text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingStudentId}
        onClose={() => setDeletingStudentId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Student"
      >
        Are you sure you want to delete this student? This action cannot be
        undone.
      </ConfirmationModal>

      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Manage Students
        </h1>
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="px-5 mb-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700"
        >
          Bulk Import from CSV
        </button>
        {notification.message && (
          <div
            className={`p-3 rounded-md mb-4 text-sm ${
              notification.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {notification.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-bold mb-4">Existing Students</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Department</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.student_id} className="border-b">
                      <td className="px-4 py-2">{s.student_id}</td>
                      <td className="px-4 py-2">{s.name}</td>
                      <td className="px-4 py-2">{s.dept_name}</td>
                      <td className="px-4 py-2 flex space-x-2">
                        <button
                          onClick={() => setEditingStudent(s)}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingStudentId(s.student_id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <ManagementForm
              title="Add New Student"
              fields={studentFormFields}
              onSubmit={handleFormSubmit}
              submitButtonText="Add Student"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default StudentManager;
