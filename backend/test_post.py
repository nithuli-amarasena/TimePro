<<<<<<< Updated upstream
=======
# backend/test_post.py

>>>>>>> Stashed changes
import requests
import datetime

# Define the API endpoint
API_URL = "http://127.0.0.1:5000/api/tasks"

# 1. Define the data we want to send (in JSON format)
new_task_data = {
<<<<<<< Updated upstream
    "task_name": "Learn Flask POST request",
    "start_time": datetime.datetime.now().isoformat(), # Use current time for testing
=======
    "title": "Successfully tested POST and GET endpoints!",
    "start_time": datetime.datetime.now().isoformat(), 
>>>>>>> Stashed changes
    "end_time": (datetime.datetime.now() + datetime.timedelta(hours=1)).isoformat()
}

# 2. Send the POST request
<<<<<<< Updated upstream
=======
print(f"Sending POST request to {API_URL}...")
>>>>>>> Stashed changes
response = requests.post(API_URL, json=new_task_data)

# 3. Print the result
if response.status_code == 201:
    print("✅ Success! Task created.")
    print(response.json())
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)