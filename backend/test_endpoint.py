import requests

url = "http://127.0.0.1:8000/analyze/send-welcome-email"
data = {
    "email": "g.g.sriram.2004@gmail.com",
    "name": "Sriram Test",
    "source": "test_script"
}

try:
    response = requests.post(url, json=data)
    print("Status Code:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Connection failed. Is the server running on port 8000?")
    print("Error:", e)
