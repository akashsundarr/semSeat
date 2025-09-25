import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  // State to manage the visibility of the dropdown menu
  const [isManagementOpen, setIsManagementOpen] = useState(false);

  // Function to style the active NavLink
  const linkClass = ({ isActive }) => 
    isActive 
      ? 'text-indigo-600 font-bold' 
      : 'text-gray-600 font-medium hover:text-indigo-600';
  
  // Function to style the dropdown links
  const dropdownLinkClass = ({ isActive }) =>
    isActive
      ? 'block px-4 py-2 text-sm text-white bg-indigo-600'
      : 'block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100';


  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm-px-6 lg-px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="font-bold text-xl text-indigo-600">SemSEAT</span>
          </div>
          <div className="flex space-x-6">
             <NavLink to="/" className={linkClass}>Dashboard</NavLink>
             <NavLink to="/allocation" className={linkClass}>Allocation</NavLink>
             
             {/* Management Dropdown */}
             <div 
               className="relative" 
               onMouseEnter={() => setIsManagementOpen(true)}
               onMouseLeave={() => setIsManagementOpen(false)}
             >
               <button className="text-gray-600 font-medium hover-text-indigo-600 flex items-center">
                 Management
                 {/* Arrow icon */}
                 <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                 </svg>
               </button>

               {/* Dropdown Menu - Conditionally rendered */}
               {isManagementOpen && (
                 <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                   <div className="py-1">
                     <NavLink to="/management/exam-series" className={dropdownLinkClass}>
                       Manage Exam Series
                     </NavLink>
                     <NavLink to="/management/schedule-exam" className={dropdownLinkClass}>
                       Schedule New Exam
                     </NavLink>
                   </div>
                 </div>
               )}
             </div>

             <a href="#" className="text-gray-600 font-medium hover-text-indigo-600">Data</a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;