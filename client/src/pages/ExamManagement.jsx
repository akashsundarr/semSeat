import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getExamSeries, addExamSeries, updateExamSeries, deleteExamSeries } from "../api/examSeriesApi";
import { getScheduledExams, scheduleExam, deleteScheduledExamSession } from "../api/scheduledExamApi";
import { getSubjects } from "../api/infoApi";
import ManagementForm from "../components/ManagementForm";
import ConfirmationModal from "../components/ConfirmationModal";

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const baseClasses = "fixed top-20 right-5 p-4 rounded-lg shadow-lg text-sm z-50 transition-transform transform-gpu animate-slideInLeft";
  const typeClasses = type === "success" ? "bg-accent-50 text-accent-700" : "bg-danger-100 text-danger-700";
  return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

function ExamManagementPage() {
  const [examSeries, setExamSeries] = useState([]);
  const [scheduledExams, setScheduledExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [modal, setModal] = useState({ type: null, data: null });

  const subjectOptions = useMemo(() => subjects.map((s) => ({ value: s.subject_id, label: `${s.subject_name} (${s.subject_code})` })), [subjects]);
  const seriesOptions = useMemo(() => examSeries.map((s) => ({ value: s.series_id, label: s.series_name })), [examSeries]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [seriesData, scheduledData, subjectsData] = await Promise.all([getExamSeries(), getScheduledExams(), getSubjects()]);
      setExamSeries(seriesData);
      setScheduledExams(scheduledData);
      setSubjects(subjectsData);
    } catch (error) {
      setNotification({ message: error.message || "Failed to fetch initial data.", type: "error" });
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
      switch (modal.type) {
        case "addSeries":
          result = await addExamSeries(formData);
          break;
        case "editSeries":
          result = await updateExamSeries(modal.data.series_id, formData);
          break;
        case "scheduleExam":
          result = await scheduleExam(formData);
          break;
        default:
          throw new Error("Invalid form submission type");
      }
      setNotification({ message: result.message, type: "success" });
      fetchData();
    } catch (error) {
      setNotification({ message: error.message, type: "error" });
    } finally {
      setModal({ type: null, data: null });
    }
  };

  const handleDelete = async () => {
    try {
      let result;
      if (modal.type === "deleteSeries") {
        result = await deleteExamSeries(modal.data.series_id);
      } else if (modal.type === "deleteSession") {
        const { series_id, exam_date, start_time } = modal.data;
        result = await deleteScheduledExamSession(series_id, exam_date, start_time);
      } else {
        throw new Error("Invalid delete operation type");
      }
      setNotification({ message: result.message, type: "success" });
      fetchData();
    } catch (error) {
      setNotification({ message: error.message, type: "error" });
    } finally {
      setModal({ type: null, data: null });
    }
  };

  const seriesFields = [
    { name: "series_name", label: "Series Name", type: "text", placeholder: "e.g., First Series Exam Oct 2025" },
    { name: "start_date", label: "Start Date", type: "date" },
    { name: "end_date", label: "End Date", type: "date" },
  ];

  const scheduleFields = [
    { name: "series_id", label: "Exam Series", type: "select", options: seriesOptions },
    { name: "subject_ids", label: "Subjects (select one or more)", type: "multi-select", options: subjectOptions },
    { name: "exam_date", label: "Exam Date", type: "date" },
    { name: "start_time", label: "Start Time", type: "time" },
    { name: "end_time", label: "End Time", type: "time" },
  ];

  return (
    <>
      <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: "", type: "" })} />

      {["addSeries", "editSeries", "scheduleExam"].includes(modal.type) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center animate-fadeInUp">
          <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <button onClick={() => setModal({ type: null, data: null })} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold">
              &times;
            </button>
            <ManagementForm
              key={modal.type + (modal.data?.series_id || "")}
              title={modal.type === "addSeries" ? "Add New Exam Series" : modal.type === "editSeries" ? "Edit Exam Series" : "Schedule New Exam"}
              fields={modal.type.includes("Series") ? seriesFields : scheduleFields}
              onSubmit={handleFormSubmit}
              initialData={modal.data}
            />
          </div>
        </div>
      )}

      {["deleteSeries", "deleteSession"].includes(modal.type) && (
        <ConfirmationModal
          isOpen={!!modal.type}
          onClose={() => setModal({ type: null, data: null })}
          onConfirm={handleDelete}
          title={modal.type === "deleteSeries" ? "Delete Exam Series" : "Delete Exam Session"}
        >
          <p>Are you sure? This action cannot be undone and may affect existing allocations.</p>
        </ConfirmationModal>
      )}

      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Exam Series</h2>
            <button onClick={() => setModal({ type: "addSeries", data: null })} className="px-4 py-2 bg-gray-700 text-white rounded-md font-semibold hover:bg-gray-900 transition">
              Create New Series
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fadeInUp">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {examSeries.map((series) => (
                  <li key={series.series_id} className="py-3 flex justify-between items-center hover:bg-gray-50 rounded-md cursor-pointer transition">
                    <span>{series.series_name}</span>
                    <div className="space-x-4">
                      <button onClick={() => setModal({ type: "editSeries", data: series })} className="text-gray-600 hover:underline text-sm">
                        Edit
                      </button>
                      <button onClick={() => setModal({ type: "deleteSeries", data: series })} className="text-gray-800 hover:underline text-sm">
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Scheduled Exams</h2>
            <button onClick={() => setModal({ type: "scheduleExam", data: null })} className="px-4 py-2 bg-gray-700 text-white rounded-md font-semibold hover:bg-accent-700 transition">
              Schedule New Exam
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fadeInUp min-h-[100px]">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <ul className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
                {scheduledExams.map((session) => (
                  <li key={session.session_key} className="py-3 flex justify-between items-center hover:bg-gray-50 rounded-md cursor-pointer transition">
                    <div>
                      <p className="font-semibold text-gray-800">{session.series_name}</p>
                      <p className="text-sm text-gray-600">{new Date(session.exam_date + "T12:00:00Z").toLocaleDateString()} at {session.start_time}</p>
                      <p className="text-xs text-gray-500 mt-1">{session.subjects}</p>
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => setModal({ type: "deleteSession", data: session })} className="text-gray-600 hover:underline text-sm">
                        Delete Session
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.4s ease-out forwards;
        }
      `}</style>
    </>
  );
}

export default ExamManagementPage;
