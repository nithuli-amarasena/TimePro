import requests

# Define the API endpoint URL
BASE_URL = "http://127.0.0.1:5000/api/tasks"

# IMPORTANT: You must change this ID to an ID that exists in your database!
TASK_ID_TO_DELETE = 1 

# --- Test Functions ---

def test_delete(task_id):
    """Sends a DELETE request to the specified task ID."""
    delete_url = f"{BASE_URL}/{task_id}"
    print(f"Sending DELETE request to: {delete_url}")
    
    response = requests.delete(delete_url)
    
    if response.status_code == 200:
        print(f"✅ Success! Task {task_id} deleted.")
        print(response.json())
    elif response.status_code == 404:
        print(f"⚠️ Warning: Task {task_id} not found (as expected if run twice).")
    else:
        print(f"❌ Error deleting task {task_id}. Status: {response.status_code}")
        print(response.text)

def test_get_all():
    """Sends a GET request to check the list of remaining tasks."""
    print("\nVerifying tasks remaining with GET request...")
    response = requests.get(BASE_URL)
    
    if response.status_code == 200:
        tasks = response.json()
        print(f"Total tasks remaining: {len(tasks)}")
        for task in tasks:
            print(f"- ID {task['id']}: {task['title']}")
    else:
        print(f"❌ Error retrieving tasks. Status: {response.status_code}")

if __name__ == '__main__':
    # 1. Start the test by trying to delete the specified ID
    test_delete(TASK_ID_TO_DELETE)
    
    # 2. Check the remaining tasks
    test_get_all()
    
    # 3. Try to delete the same ID again (should result in 404)
    print("\nAttempting to delete the same task again...")
    test_delete(TASK_ID_TO_DELETE)
    
    # 4. Final check
    test_get_all()