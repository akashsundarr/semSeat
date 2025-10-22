
```
semSeat
├─ backend
│  ├─ .env
│  ├─ db
│  │  └─ connection.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ routes
│  │  ├─ allocations.js
│  │  ├─ info.js
│  │  ├─ insertData.js
│  │  └─ management.js
│  └─ server.js
└─ frontend
   ├─ eslint.config.js
   ├─ index.html
   ├─ package-lock.json
   ├─ package.json
   ├─ public
   ├─ README.md
   ├─ src
   │  ├─ App.jsx
   │  ├─ components
   │  │  └─ Navbar.jsx
   │  ├─ index.css
   │  ├─ main.jsx
   │  ├─ pages
   │  │  ├─ Allocation.jsx
   │  │  ├─ Dashboard.jsx
   │  │  └─ management
   │  │     ├─ ExamSeries.jsx
   │  │     └─ ScheduleExam.jsx
   │  └─ services
   │     └─ api.js
   └─ vite.config.js

```


Database Name: seating_allocation_db

Tables:

1. allocations
   - allocation_id (int, primary key, auto_increment)
   - student_id (varchar, foreign key → students.student_id)
   - room_id (varchar, foreign key → classroom.room_id)
   - row_number (int)
   - bench_number (int)
   - seat_position (enum: LEFT, RIGHT, CENTER)
   - exam_id (int, foreign key → scheduledexams.exam_id)

2. classroom
   - room_id (varchar, primary key)
   - capacity (int)

3. departments
   - dept_id (int, primary key, auto_increment)
   - dept_name (varchar)
   - dept_code (varchar, unique)

4. examseries
   - series_id (int, primary key, auto_increment)
   - series_name (varchar)
   - start_date (date)
   - end_date (date)

5. scheduledexams
   - exam_id (int, primary key, auto_increment)
   - series_id (int, foreign key → examseries.series_id)
   - subject_id (int, foreign key → subjects.subject_id)
   - exam_date (date)
   - start_time (time)
   - end_time (time)

6. students
   - student_id (varchar, primary key)
   - name (varchar)
   - batch (varchar)
   - semester (int)
   - status (enum: Active, Inactive)
   - dept_id (int, foreign key → departments.dept_id)

7. subjects
   - subject_id (int, primary key, auto_increment)
   - subject_code (varchar, unique)
   - subject_name (varchar)
   - semester (int)
   - dept_id (int, foreign key → departments.dept_id)



Database: seating_allocation_db

Tables and Sample Data:

1. classroom
   room_id: 501
   capacity: 50

2. departments
   dept_id: 1
   dept_name: Computer Science and Engineering
   dept_code: CSE

3. students
   student_id: CEC24CS001
   name: CSE_Student_1
   batch: 2024
   semester: 1
   status: Active
   dept_id: 1

4. subjects
   subject_id: 1
   subject_code: CS101
   subject_name: Programming Basics
   semester: 1
   dept_id: 1

5. examseries
   series_id: (empty)
   series_name: (empty)
   start_date: (empty)
   end_date: (empty)

6. scheduledexams
   exam_id: (empty)
   series_id: (empty)
   subject_id: (empty)
   exam_date: (empty)
   start_time: (empty)
   end_time: (empty)

7. allocations
   allocation_id: (empty)
   student_id: (empty)
   room_id: (empty)
   row_number: (empty)
   bench_number: (empty)
   seat_position: (empty)
   exam_id: (empty)



USE seating_allocation_db;

-- Disable foreign key checks to avoid constraint errors
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate all tables
TRUNCATE TABLE allocations;
TRUNCATE TABLE classroom;
TRUNCATE TABLE departments;
TRUNCATE TABLE examseries;
TRUNCATE TABLE scheduledexams;
TRUNCATE TABLE students;
TRUNCATE TABLE subjects;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;



INSERTIONS:


-- Departments
INSERT INTO departments (dept_id, dept_name, dept_code) VALUES
(1, 'Computer Science and Engineering', 'CSE'),
(2, 'Electronics and Communication', 'EC'),
(3, 'Electrical and Electronics Engineering', 'EEE');


-- Classroom
INSERT INTO classroom (room_id, capacity) VALUES
('501', 63),
('502', 63);



-- Subjects (KTU 2019 Scheme Inspired: S3, S5, S7)
INSERT INTO subjects (subject_id, subject_code, subject_name, semester, dept_id) VALUES
-- S3 Subjects
(101, 'CS201', 'Data Structures', 3, 1), -- CSE (dept_id 1)
(102, 'EC201', 'Network Theory', 3, 2), -- EC (dept_id 2)
(103, 'EE201', 'Circuits and Systems', 3, 3), -- EEE (dept_id 3)

-- S5 Subjects
(201, 'CS301', 'Theory of Computation', 5, 1), -- CSE (dept_id 1)
(202, 'EC301', 'Digital Signal Processing', 5, 2), -- EC (dept_id 2)
(203, 'EE301', 'Power Electronics', 5, 3), -- EEE (dept_id 3)

-- S7 Subjects
(301, 'CS401', 'Advanced Computer Networks', 7, 1), -- CSE (dept_id 1)
(302, 'EC401', 'VLSI Design', 7, 2), -- EC (dept_id 2)
(303, 'EE401', 'Electric Drives', 7, 3); -- EEE (dept_id 3)



-- Exam Series
INSERT INTO examseries (series_id, series_name, start_date, end_date) VALUES
(1, 'Cycle Test 1 (S3)', '2025-08-15', '2025-08-20'),
(2, 'End Semester Exam (S5)', '2025-11-20', '2025-12-05'),
(3, 'End Semester Exam (S7)', '2025-11-20', '2025-12-05');



-- Scheduled Exams
INSERT INTO scheduledexams (exam_id, series_id, subject_id, exam_date, start_time, end_time) VALUES
-- S3 Exams (Series 1)
(10, 1, 101, '2025-08-16', '09:30:00', '12:30:00'), -- CS201 (S3)
(11, 1, 102, '2025-08-17', '14:00:00', '17:00:00'), -- EC201 (S3)

-- S5 Exams (Series 2)
(20, 2, 201, '2025-11-21', '09:30:00', '12:30:00'), -- CS301 (S5)
(21, 2, 203, '2025-11-23', '09:30:00', '12:30:00'), -- EE301 (S5)

-- S7 Exams (Series 3)
(30, 3, 302, '2025-11-25', '14:00:00', '17:00:00'); -- EC401 (S7)