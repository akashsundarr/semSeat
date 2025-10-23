import React, { useState } from "react";

const Notification = ({ message, type }) => {
  if (!message) return null;
  const baseClasses = "p-3 rounded-md mb-4 text-sm";
  const typeClasses =
    type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

function ManagementForm({ title, fields, onSubmit }) {
  const initialFormState = fields.reduce((acc, field) => {
    acc[field.name] = field.type === "multi-select" ? [] : "";
    return acc;
  }, {});

  const [formData, setFormData] = useState(initialFormState);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    if (e.target.type === "select-multiple") {
      const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
      setFormData({ ...formData, [e.target.name]: selectedOptions });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification({ message: "", type: "" });
    try {
      const result = await onSubmit(formData);
      setNotification({ message: result.message, type: "success" });
      setFormData(initialFormState);
    } catch (error) {
      setNotification({ message: error.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border w-full max-w-lg">
      <h3 className="text-2xl font-bold mb-6 text-gray-800">{title}</h3>
      <Notification message={notification.message} type={notification.type} />
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
              {field.label}
            </label>
            {field.type === "multi-select" ? (
              <select
                multiple
                name={field.name}
                id={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                required
                className="mt-1 block w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-700 focus:border-gray-700"
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === "select" ? (
              <select
                name={field.name}
                id={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-700 focus:border-gray-700"
              >
                <option value="" disabled>
                  Select a {field.label}
                </option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.name}
                id={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-700 focus:border-gray-700"
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md font-semibold hover:bg-gray-900 disabled:bg-gray-400 transition"
        >
          {isLoading ? "Submitting..." : `Add ${title}`}
        </button>
      </form>
    </div>
  );
}

export default ManagementForm;
