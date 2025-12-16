import { useState , useEffect} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [tasks, setTasks] = useState([]);    //State to hold the tasks
  useEffect(() => {
    fetch('http://localhost:5000/api/tasks')
      .then(response => response.json())
      .then(data => {
        setTasks(data);   //Saves data to state
      })
      .catch(error => console.error('Error fetching tasks:', error));
  }, []);

  // NEW FUNCTION: Handles the DELETE request

  const handleDelete = (id) => {
    // 1. Send the DELETE request to the Flask endpoint
    fetch(`http://localhost:5000/api/tasks/${id}`, {
      method: 'DELETE', 
    })

    .then(response => {
      if (response.ok) { // Check for status code 200-299
        // 2. If successful, remove the task from the React state immediately
        setTasks(currentTasks => currentTasks.filter(task => task.id !== id));
        console.log(`Task ${id} deleted successfully`);
      } else {
        console.error('Failed to delete task');
      }
    })

    .catch(error => console.error('Error deleting task:', error));

  };

  return (
    <div className="App">
      <h1>My Time Logger</h1>
      <div className="task-list">
        {tasks.map(task => (
          <div key={task.id} className="task-item">
            {task.title}
            {/* 3. NEW BUTTON: Calls handleDelete with the task's ID */}
            <button onClick={() => handleDelete(task.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 

export default App
