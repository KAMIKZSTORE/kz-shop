from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

API_KEY = "API_KEY_GEMINI_KAMU"

@app.route("/ai", methods=["POST"])
def ai_chat():
    prompt = request.json.get("prompt", "")
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key={API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    r = requests.post(url, json=payload)
    data = r.json()
    reply = data["candidates"][0]["content"]["parts"][0]["text"]
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(debug=True)
