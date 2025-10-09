import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { getAllocationsForTimeSlot } from '../api/allocationsApi';
import { getRooms } from '../api/infoApi';

// Renders a single seat with student info or an empty box
const Seat = ({ student }) => {
  if (!student) {
    return <div className="w-full h-20 border border-dashed border-gray-300 rounded-md bg-gray-50"></div>;
  }
  return (
    <div className="w-full p-2 border bg-white rounded-md shadow-sm">
      <p className="font-bold text-sm truncate">{student.name}</p>
      <p className="text-xs text-gray-600">{student.student_id}</p>
      <p className="text-xs text-gray-500">{student.batch} / Sem {student.semester}</p>
    </div>
  );
};

// Renders a bench with three seats
const Bench = ({ students }) => {
  const seats = { left: null, middle: null, right: null };
  students.forEach(s => {
    seats[s.seat_position] = s;
  });

  return (
    <div className="flex w-full space-x-2">
      <div className="w-1/3"><Seat student={seats.left} /></div>
      <div className="w-1/3"><Seat student={seats.middle} /></div>
      <div className="w-1/3"><Seat student={seats.right} /></div>
    </div>
  );
};


function ViewAllocation() {
  const location = useLocation(); // Hook to access URL query parameters
  const [allocations, setAllocations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect to fetch data whenever the URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const seriesId = params.get('seriesId');
    const date = params.get('date');
    const time = params.get('time');

    const fetchData = async () => {
      if (!seriesId || !date || !time) {
        setError('Missing required information to fetch allocations.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        // Fetch both allocations and room details in parallel
        const [allocationsData, roomsData] = await Promise.all([
          getAllocationsForTimeSlot(seriesId, date, time),
          getRooms(),
        ]);
        setAllocations(allocationsData);
        setRooms(roomsData);
        // Set the default selected room based on what's in the allocation data
        if (roomsData.length > 0) {
          const uniqueRoomIds = [...new Set(allocationsData.map(a => a.room_id))];
          setSelectedRoomId(uniqueRoomIds.length > 0 ? uniqueRoomIds[0] : roomsData[0].room_id);
        }
        setError(null);
      } catch {
        setError('Failed to fetch allocation data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [location.search]);

  // Memoized calculation to process data only when dependencies change
  const { roomLayout, csvData, allocatedRooms } = useMemo(() => {
    // Find the full room object to get its capacity
    const selectedRoom = rooms.find(r => r.room_id === selectedRoomId);
    if (!selectedRoom) return { roomLayout: {}, csvData: [], allocatedRooms: [] };

    // Get a unique, sorted list of rooms that have students assigned to them
    const uniqueAllocatedRooms = [...new Set(allocations.map(a => a.room_id))].sort();

    // Prepare data for the master CSV export (includes all rooms)
    const csvExportData = allocations.map(a => ({
        Room: a.room_id,
        Row: a.row_number,
        Bench: a.bench_number,
        Seat: a.seat_position,
        StudentID: a.student_id,
        StudentName: a.name,
        Semester: a.semester,
        Batch: a.batch
    }));

    // Build the complete visual grid for the *selected room*
    const grid = {};
    const roomAllocations = allocations.filter(a => a.room_id === selectedRoomId);
    const totalBenches = Math.ceil(selectedRoom.capacity / 3);
    const benchesPerRow = 7; // As defined in backend logic
    
    let rowNum = 1;
    let benchNumInRow = 1;

    for (let i = 1; i <= totalBenches; i++) {
        if (!grid[rowNum]) {
            // Initialize the row with empty bench structures
            grid[rowNum] = Array.from({ length: benchesPerRow }, (_, j) => ({
                benchNum: j + 1,
                students: []
            }));
        }
        
        // Find students allocated to this specific bench and place them in the grid
        const studentsForBench = roomAllocations.filter(
            a => a.row_number === rowNum && a.bench_number === benchNumInRow
        );
        if(grid[rowNum] && grid[rowNum][benchNumInRow - 1]) {
            grid[rowNum][benchNumInRow - 1].students = studentsForBench;
        }

        benchNumInRow++;
        if (benchNumInRow > benchesPerRow) {
            benchNumInRow = 1;
            rowNum++;
        }
    }
    
    return { roomLayout: grid, csvData: csvExportData, allocatedRooms: uniqueAllocatedRooms };
  }, [allocations, rooms, selectedRoomId]);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading allocation details...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-100 rounded-md">{error}</div>;

  const selectedRoomForHeader = rooms.find(r => r.room_id === selectedRoomId);

  return (
    // Main container for the interactive on-screen view
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Seating Arrangement</h1>
          <p className="text-gray-600">Room: <strong>{selectedRoomId}</strong> (Capacity: {selectedRoomForHeader?.capacity})</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="p-2 border rounded-md"
          >
            {allocatedRooms.map(roomId => (
              <option key={roomId} value={roomId}>{roomId}</option>
            ))}
          </select>
          <CSVLink
            data={csvData}
            filename={`master_allocation_${new URLSearchParams(location.search).get('date')}.csv`}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700"
            target="_blank"
          >
            Export All to Excel
          </CSVLink>
          <Link to="/" className="text-blue-600 hover:underline">&larr; Dashboard</Link>
        </div>
      </div>
      
      {/* Container for the visual seating chart grid */}
      <div className="bg-white p-6 rounded-lg shadow-md border overflow-x-auto">
          <div className="flex flex-row gap-8">
          {Object.keys(roomLayout).sort((a,b) => a - b).map(rowNum => (
              <div key={rowNum} className="flex flex-col space-y-4 flex-shrink-0 w-80">
              <h3 className="text-md font-bold text-center text-gray-600">ROW {rowNum}</h3>
              {roomLayout[rowNum] && roomLayout[rowNum].map(({ benchNum, students }) => (
                  <div key={benchNum} className="flex flex-col items-center">
                  <Bench students={students} />
                  <span className="text-xs text-gray-400 mt-1">Bench {benchNum}</span>
                  </div>
              ))}
              </div>
          ))}
          </div>
      </div>
    </div>
  );
}

export default ViewAllocation;