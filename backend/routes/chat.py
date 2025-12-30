
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import os
import httpx
from dotenv import load_dotenv

# Optional AI libraries
try:
    import openai
except ImportError:
    openai = None

load_dotenv()

router = APIRouter()

# --- Configuration ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize Clients
openai_client = None
if OPENAI_API_KEY and openai:
    openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)

class ChatRequest(BaseModel):
    message: str
    history: list = []

SYSTEM_PROMPT = """
You are GuardAI, the intelligent assistant for FakeJobAI. 
Your goal is to help users identify potential job scams, understand cybersecurity risks, and navigate the job market safely.
- Be concise, professional, and empathetic.
- If a user pastes a job description, analyze it for red flags (urgency, bad grammar, too good to be true).
- If you are unsure, advise the user to use the "Analyze Text" or "Scan URL" features on the dashboard.
- Do NOT give legal advice.
"""

@router.post("/chat_reply")
async def chat_reply(request: ChatRequest):
    user_message = request.message
    print(f"Chat Request: {user_message}")
    
    # 0. Debug Ping
    if user_message.strip().lower() == "ping":
        return {"reply": "pong"}

    # Priority 1: Google Gemini (Free Tier)
    if GEMINI_API_KEY:
        try:
            # Construct context
            history_text = "\n".join([f"{msg.get('role', 'User')}: {msg.get('content', '')}" for msg in request.history[-4:]])
            full_prompt = f"{SYSTEM_PROMPT}\n\nRecent Chat History:\n{history_text}\n\nUser: {user_message}\nGuardAI:"
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
            
            payload = {
                "contents": [{
                    "parts": [{"text": full_prompt}]
                }]
            }
            
            # Short timeout (3s) to prevent UI hang
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(url, json=payload, timeout=3.0)
                    
                    if response.status_code == 200:
                        data = response.json()
                        if "candidates" in data and data["candidates"]:
                            reply = data["candidates"][0]["content"]["parts"][0]["text"]
                            return {"reply": reply}
                        else:
                            print(f"Gemini Empty Response: {data}")
                    else:
                        print(f"Gemini API Error: {response.status_code} - {response.text}")
                except httpx.TimeoutException:
                     print("Gemini Timeout (3s)")
                    
        except Exception as e:
            print(f"Gemini REST Error: {e}")
            # Fallthrough to OpenAI

    # Priority 2: OpenAI
    if openai_client:
        try:
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            for msg in request.history[-4:]:
                messages.append(msg)
            messages.append({"role": "user", "content": user_message})

            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=200,
                temperature=0.7,
                timeout=3.0 # Short timeout
            )
            return {"reply": response.choices[0].message.content}
        except Exception as e:
            print(f"OpenAI Error: {e}")

    # Fallback: Rule-based (Offline)
    lower_msg = user_message.lower()
    if "hello" in lower_msg or "hi" in lower_msg:
        return {
            "reply": "Hello! I'm GuardAI 🛡️. I can interpret job descriptions or answer questions about fraud safety. (Offline Mode Active)"
        }
    elif "scam" in lower_msg or "fake" in lower_msg or "money" in lower_msg or "pay" in lower_msg:
        return {
            "reply": "I'm offline right now, but here's a tip: Never pay for equipment upfront. Legitimate companies provider hardware. If they ask for a check or crypto, it's a scam."
        }
    else:
        return {
            "reply": "My AI brain is currently unreachable (Connection Timeout). But I'm here to help! Use the 'Analyze Text' feature on the dashboard for a deep scan."
        }
