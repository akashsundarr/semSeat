import React, { useState, useEffect } from 'react';
import ManagementForm from '../components/ManagementForm';
import * as api from '../api/managementApi'; // All functions are now in the 'api' object
import { getDepartments } from '../api/infoApi';

function ManagementPage() {
   const [departments, setDepartments] = useState([]);
   useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("Could not fetch departments for forms.", error);
      }
    };
    fetchDepts();
  }, []);

  const departmentOptions = departments.map(dept => ({
    value: dept.dept_id,
    label: `${dept.dept_name} (${dept.dept_code})`
  }));

  const forms = [
    { 
      title: 'Student', 
      // --- THIS IS THE FIX ---
      onSubmit: api.addStudent, // Changed from managementApi to api
      fields: [
        { name: 'student_id', label: 'Student ID', type: 'text', placeholder: 'e.g., CEC24CS001' },
        { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Akash Sundar' },
        { name: 'batch', label: 'Batch', type: 'text', placeholder: '2024-2028' },
        { name: 'semester', label: 'Semester', type: 'number', placeholder: 'e.g., 3' },
        { name: 'dept_id', label: 'Department', type: 'select', options: departmentOptions },
      ]
    },
    { 
      title: 'Classroom', 
      onSubmit: api.addClassroom,
      fields: [
        { name: 'room_id', label: 'Room ID', type: 'text', placeholder: 'e.g., R101' },
        { name: 'capacity', label: 'Capacity', type: 'number', placeholder: 'e.g., 42' },
      ]
    },
    { 
      title: 'Department', 
      onSubmit: api.addDepartment,
      fields: [
        { name: 'dept_name', label: 'Department Name', type: 'text', placeholder: 'Computer Science' },
        { name: 'dept_code', label: 'Department Code', type: 'text', placeholder: 'CSE' },
      ]
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Data Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {forms.map(form => (
          <ManagementForm
            key={form.title}
            title={form.title}
            fields={form.fields}
            onSubmit={form.onSubmit}
          />
        ))}
      </div>
    </div>
  );
}

export default ManagementPage;