semSeat

Classroom Seating Allocation System using the MERN Stack

🚀 Table of Contents

About

Features

Architecture & Tech Stack

Getting Started

Prerequisites

Installation

Running the App

Database Schema

Usage

Contributing

License

Contact

About

semSeat is a full-stack web application designed to simplify and automate the process of allocating seats for students in exam rooms or classrooms. Built with the MERN stack (MongoDB, Express, React, Node.js), it supports bulk student import, classroom & department management, exam scheduling, and seat allocation with visual overview.

Features

Manage departments, subjects, classrooms, students, and exam series.

Bulk import students data using a CSV file.

Define classrooms and capacities, schedule exams for different batches.

Automatically allocate seats for students across rows, benches, and positions (Left, Right, Center).

View allocations with a dashboard and seat-map style display.

Easy export or printing of the allocation list.

Architecture & Tech Stack

Front End: React (Vite build), modern UI, modular components (Dashboard, Student Manager, Classroom Manager, etc.)
Back End: Node.js + Express for REST API endpoints (allocations, management, stats, etc.)
Database: MySQL / MariaDB (SQL schema shown below)
Folder structure:

semSeat/
├─ backend/        ← API server
│   ├─ db/         ← DB connection
│   ├─ routes/     ← API route handlers (allocations.js, management.js, etc.)
│   └─ server.js
├─ client/         ← React front-end
│   ├─ src/
│   │   ├─ api/
│   │   ├─ components/
│   │   └─ pages/
│   └─ index.html
├─ students_data.csv
└─ README.md

Getting Started
Prerequisites

Node.js (v14+ recommended)

npm or yarn

MySQL / MariaDB database server

(Optional) Postman or similar for API testing

Installation

Clone the repo:

git clone https://github.com/akashsundarr/semSeat.git
cd semSeat


Configure database:

Create a database named seating_allocation_db.

Update your .env in backend/ with the DB credentials (host, user, password, database).

Install dependencies:

# in backend
cd backend
npm install  

# in client
cd ../client
npm install  

Running the App

Start the back end server:

cd backend
npm start


Start the front end:

cd ../client
npm run dev


Open your browser at http://localhost:3000 (or the port configured) to view the app.

Database Schema

Here is a summary of the core tables in seating_allocation_db:

allocations: Tracks which student is assigned to which room, row, bench, position and exam. 
GitHub

classroom: Room ID and capacity. 
GitHub

departments: Department info (dept_id, dept_name, dept_code). 
GitHub

examseries: Definitions of exam series (series_name, start & end dates). 
GitHub

scheduledexams: Individual exam entries linked to an exam series. 
GitHub

students: Student master data (student_id, name, batch, semester, status, dept_id). 
GitHub

subjects: Subject master data (subject_id, subject_code, name, semester, dept_id). 
GitHub

Usage

After setup, navigate to the “Management” section to add departments, subjects, classrooms, etc.

Use the “Bulk Import” to upload students_data.csv (or your own CSV) to add students in one go.

Schedule your exam series and individual exams under the “Exam Management” module.

Use the “View Allocation” page to generate seat allocations for a given exam and classroom.

You might export or print the allocations for proctoring or classrooms setup.

Contributing

We welcome contributions! Here are a few ways you can help:

Submit bug reports or feature requests via Issues.

Fork the repo and send pull requests for improvements, bug fixes, or enhancements.

Improve documentation or add new features (e.g., student self-service, mobile UI).

Before submitting PRs, please make sure:

Code is linted and formatted.

New features are tested.

Pull request includes a descriptive title and summary of changes.

License

This project is licensed under the MIT License.


Feel free to reach out via GitHub issues if you have questions or suggestions.

Thank you for using semSeat! Hopefully it makes the process of exam seating allocation much smoother. 😄

If you want any extra sections (e.g., API docs, deployment instructions, screenshots) added, I can help draft those too.