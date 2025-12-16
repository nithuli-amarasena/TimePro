import requests
import datetime
import json

BASE_URL = "http://127.0.0.1:5000/api/tasks"
TASK_ID_TO_UPDATE = 1 # !! MAKE SURE THIS ID EXISTS IN YOUR DB !!

updated_data = {
    "title": "Updated: Finalizing the PUT endpoint",
    "start_time": datetime.datetime.now().isoformat(),
    "end_time": (datetime.datetime.now() + datetime.timedelta(hours=3)).isoformat()
}

def test_put(task_id, data):
    print(f"--- 🚀 Testing PUT Request (Update ID: {task_id}) ---")
    response = requests.put(f"{BASE_URL}/{task_id}", json=data)
    if response.status_code == 200:
        print(f"✅ Success: Status Code {response.status_code}")
        print(response.json())
    else:
        print(f"❌ Error: Status Code {response.status_code}")
        print(response.text)
    return response

def test_get_all():
    print("\n--- 🔍 Testing GET Request (Verify Update) ---")
    response = requests.get(BASE_URL)

    if response.status_code == 200:
        tasks = response.json()
        # Look specifically for the updated task
        updated_task = next((task for task in tasks if task['id'] == TASK_ID_TO_UPDATE), None)
    
        if updated_task and updated_task['title'] == updated_data['title']:
            print("✅ Verification Successful:")
            print(json.dumps(updated_task, indent=4))
        else:
            print("❌ Verification Failed: Title was not updated.")
            print(f"Tasks in DB: {json.dumps(tasks, indent=4)}")
    else:
        print(f"❌ Error during GET verification: Status Code {response.status_code}")

if __name__ == '__main__':
    # 1. Send the PUT request
    test_put(TASK_ID_TO_UPDATE, updated_data)
    # 2. Verify the update with a GET request
    test_get_all()
