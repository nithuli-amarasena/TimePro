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
  
  return (
    <div className="App">
      <h1>My Time Logger</h1>
      <div className="task-list">
        {tasks.map(task => (
          <div key={task.id} className="task-item"> 
            {task.title}
          </div>
        ))}
      </div>

      {/*Task listing will go here*/}
    </div>
  );
}

export default App
