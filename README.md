TaskTime Logger

Time-Pro is a streamlined, full-stack application designed to help you track work hours, organize tasks by project, and visualize your daily productivity. Whether you are a freelancer or just looking to optimize your workflow, TaskTime provides a clean interface to log your sessions and stay organized.

## Features
> **Tasks Logging:** Add specific details about tasks, categorized by work types and project names.

> **Daily Summaries:** Get an instant overview of your total work for the day.

> **Smart Organization:** Easily sort and filter your logs by project and work categories.

> **Session History:** Access a comprehensive table of all past entries, including calculated durations and timestamps.

> **Clean UI:** A modern, minimalist interface built for speed and efficiency.

> **Persistent Storage:** Combines the reliability of **SQLite** with the responsiveness of **LocalStorage**.

## Tech Stack
> **Frontend:** React.js, Vite, CSS3

> **Backend:** Python (Flask)

> **Database:** SQLite

> **Local State:** LocalStorage


### Prerequisites
* **Python 3.x**

* **Node.js** (v18 or higher recommended for Vite)

### Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-username/time-logger.git
cd time-logger
```

2. **Set up the Backend (Flask)**
   
```bash
cd backend
# Activate the existing virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

3. **Set up the Frontend (Vite + React)**
   
```bash
cd ../frontend
npm install
npm run dev
```

## How To Use

1. **Define Your Context:** Enter the **Project Name** and the **Work Type** (e.g., Development, Meeting).
2. **Log Your Task:** Enter a description of what you've accomplished.
3. **Review History:** Navigate to the **Pages** to see a breakdown of your past work in the session history.
4. **Daily Check:** Use the summary to see total hours logged for the day.

## Project Structure

```text
├── backend/
│   ├── app.py              # Main Flask API
│   ├── db.py               # Database configuration & connection
│   ├── requirements.txt    # Python dependencies
│   ├── time_logger.db      # SQLite Database file
│   └── .venv/              # Virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context for state management
│   │   ├── pages/          # Individual application views
│   │   ├── App.jsx         # Main application component
│   │   └── main.jsx        # Entry point
│   ├── index.html          # HTML template
│   ├── package.json        # Node dependencies & scripts
│   └── vite.config.js      # Vite configuration
└── README.md

```

## Contributing

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

Distributed under the MIT License.
