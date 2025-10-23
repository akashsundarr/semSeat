import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getExamSeries } from "../api/infoApi";
import { resetAllAllocations } from "../api/allocationsApi";
import ConfirmationModal from "../components/ConfirmationModal";

// Notification component
const Notification = ({ message, type }) => {
  if (!message) return null;
  const baseClasses = "p-3 rounded-md my-4 text-sm transition shadow";
  const typeClasses =
    type === "success"
      ? "bg-accent-50 text-accent-700 border border-accent-100"
      : "bg-danger-100 text-danger-700 border border-danger-200";
  return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

export default function Dashboard() {
  const [seriesList, setSeriesList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalStudents: 180,
    totalClassrooms: 7,
    totalExams: 0,
    allocationsCompleted: 0,
    allocationsPending: 0,
  });

  useEffect(() => {
    fetchSeriesData();
  }, []);

  useEffect(() => {
    if (seriesList.length > 0) {
      // const totalExams = seriesList.reduce((sum, s) => sum + (s.exam_count || 0), 0);
      // const totalStudents = seriesList.reduce((sum, s) => sum + (s.student_count || 0), 0);
      const allocationsCompleted = seriesList.filter((s) => s.status === "completed").length;
      const allocationsPending = seriesList.length - allocationsCompleted;
      setStats({
        totalStudents: 180,
        totalClassrooms: 7,
        totalExams: 4,
        allocationsCompleted,
        allocationsPending,
      });
    }
  }, [seriesList]);

  const fetchSeriesData = async () => {
    setLoading(true);
    try {
      const data = await getExamSeries();
      setSeriesList(data || []);
    } catch  {
      setResetStatus({ message: "Failed to load exam series.", type: "error" });
      setSeriesList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfirm = async () => {
    setIsResetting(true);
    try {
      await resetAllAllocations();
      setResetStatus({ message: "All allocations reset successfully!", type: "success" });
      fetchSeriesData();
      setIsModalOpen(false);
      setTimeout(() => setResetStatus({ message: "", type: "" }), 5000);
    } catch (error) {
      setResetStatus({ message: `Error: ${error.message}`, type: "error" });
    } finally {
      setIsResetting(false);
    }
  };

  const StatCard = ({ label, value, color, delay }) => (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-lg transition duration-200 animate-fadeInUp`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <p className={`text-3xl font-bold text-${color}-600 mt-2`}>{value}</p>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      completed: { bg: "bg-accent-100", text: "text-accent-700", label: "✓ Completed" },
      pending: { bg: "bg-warning-100", text: "text-gray-700", label: "⏱ Pending" },
      in_progress: { bg: "bg-primary-100", text: "text-primary-700", label: "→ In Progress" },
    };
    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text} animate-pulse`}
      >
        {config.label}
      </span>
    );
  };

  const SeriesCard = ({ series, index }) => {
    const totalCount = series.student_count || 0;
    const allocatedCount = series.allocated_count || 0;
    const progressPercent = totalCount > 0 ? (allocatedCount / totalCount) * 100 : 0;

    return (
      <Link
        to={`/series/${series.series_id}`}
        className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition duration-200 group animate-fadeInUp"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h5 className="text-xl font-bold text-gray-800 group-hover:text-primary-700 transition-colors">
              {series.series_name}
            </h5>
            <p className="text-gray-500 text-sm mt-1">
              {series.start_date && series.end_date
                ? `${new Date(series.start_date).toLocaleDateString()} - ${new Date(series.end_date).toLocaleDateString()}`
                : "23-Oct-2025 - 25-Oct-2025"}
            </p>
          </div>
          <StatusBadge status={series.status || "pending"} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-gray-500 text-xs font-medium">Exams</p>
            <p className="text-lg font-bold text-gray-800 mt-1">{series.exam_count || 4}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs font-medium">Students</p>
            <p className="text-lg font-bold text-gray-800 mt-1">{series.student_count || 180}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs font-medium">Allocated</p>
            <p className="text-lg font-bold text-accent-700 mt-1">{series.allocated_count || 0}</p>
          </div>
        </div>
        {totalCount > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-medium text-gray-500">Progress</p>
              <p className="text-xs font-bold text-gray-800">{Math.round(progressPercent)}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
        <div className="mt-4 flex items-center text-primary-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          View Details →
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="ml-4 text-gray-500 font-medium mt-4">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleResetConfirm}
        title="Reset All Allocations"
      >
        <p>
          Are you sure? This will permanently delete all seating arrangements and reset every student's status. This action cannot be undone.
        </p>
      </ConfirmationModal>
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="container mx-auto p-4 md:p-8">
          <div className="mb-8 animate-fadeInDown">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 font-heading">
              Exam Dashboard
            </h1>
            <p className="text-gray-600">
              Manage exam series, allocate seats, and track allocation progress
            </p>
          </div>
          <Notification message={resetStatus.message} type={resetStatus.type} />

          <div className="mb-8 flex flex-wrap items-center gap-2 bg-white p-4 rounded-lg border border-gray-200 shadow-sm animate-fadeInUp">
            <span className="text-sm font-semibold text-gray-600 px-7">Quick Access:</span>
            <Link
              to="/manage/students"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-900 text-xs sm:text-sm transition"
            >
              Manage Students
            </Link>
            <Link
              to="/manage/classrooms"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-900 text-xs sm:text-sm transition"
            >
              Manage Classrooms
            </Link>
            <Link
              to="/manage/departments"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-900 text-xs sm:text-sm transition"
            >
              Manage Departments
            </Link>
            <Link
              to="/manage-exams"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-900 text-xs sm:text-sm transition"
            >
              Manage Exams
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={isResetting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-900 disabled:bg-gray-900 text-xs sm:text-sm ml-auto transition"
            >
              {isResetting ? 'Resetting...' : 'Reset All'}
            </button>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 animate-fadeInUp">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label=" Total Students" value={stats.totalStudents} color="primary" delay={0} />
              <StatCard label=" Total Classrooms" value={stats.totalClassrooms} color="gray" delay={100} />
              <StatCard label=" Total Exams" value={stats.totalExams} color="accent" delay={200} />
              <StatCard label=" Series Completed" value={stats.allocationsCompleted} color="accent" delay={300} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6 animate-fadeInUp">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Exam Series</h2>
                <p className="text-gray-600 text-sm mt-1">Click on any series to view details and run allocations</p>
              </div>
              <span className="bg-primary-50 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full">
                {seriesList.length} Series
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {seriesList.length > 0 ? (
                seriesList.map((series, idx) => (
                  <SeriesCard key={series.series_id} series={series} index={idx} />
                ))
              ) : (
                <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500 font-medium text-lg mb-1">📚</p>
                  <p className="text-gray-500 font-medium">No exam series found</p>
                  <p className="text-gray-400 text-sm">Create an exam series to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out forwards;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </>
  );
}
