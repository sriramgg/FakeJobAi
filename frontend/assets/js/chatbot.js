/**
 * FakeJobAI - GuardAI Chatbot Widget
 * Automatically injects the chat standard UI and handles logic.
 */

(function () {
    const API_BASE = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000/analyze"
        : "/analyze";

    // 1. Inject CSS Styles
    const style = document.createElement('style');
    style.innerHTML = `
        /* Chat Widget Container */
        .chat-widget-container {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 9999;
            font-family: 'Gadugi', sans-serif;
        }

        /* Float Trigger Button */
        .chat-toggle-btn {
            width: 50px;
            height: 50px; 
            background: transparent;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: visible;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            filter: drop-shadow(0 5px 15px rgba(67, 97, 238, 0.3));
        }

        .chat-toggle-btn img {
            width: 90%;
            height: 90%;
            object-fit: contain;
            mix-blend-mode: multiply; /* Removes white background from non-transparent images */
        }

        .chat-toggle-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 25px rgba(67, 97, 238, 0.4);
        }

        .chat-toggle-btn .notification-dot {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 14px;
            height: 14px;
            background: #ef4444;
            border: 2px solid white;
            border-radius: 50%;
            display: block;
        }

        /* Chat Window */
        .chat-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 500px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 20px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform-origin: bottom right;
            transform: scale(0);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
            visibility: hidden;
        }

        .chat-window.open {
            transform: scale(1);
            opacity: 1;
            visibility: visible;
        }

        /* Header */
        .chat-header {
            background: linear-gradient(to right, #4361ee, #3f37c9);
            padding: 20px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .chat-header h5 {
            margin: 0;
            font-size: 1.1rem;
            font-family: 'Gadugi', sans-serif;
            font-weight: 700;
        }

        .chat-close {
            background: none;
            border: none;
            color: rgba(255,255,255,0.8);
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0;
        }
        
        .chat-close:hover { color: white; }

        /* Messages Area */
        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
            background: #f8f9fa;
        }

        .message {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 15px;
            font-size: 0.9rem;
            line-height: 1.5;
            position: relative;
            word-wrap: break-word;
        }

        .message.bot {
            align-self: flex-start;
            background: white;
            border-bottom-left-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            color: #333;
        }

        .message.user {
            align-self: flex-end;
            background: #4361ee;
            color: white;
            border-bottom-right-radius: 4px;
            box-shadow: 0 4px 10px rgba(67, 97, 238, 0.2);
        }

        .typing-indicator {
            align-self: flex-start;
            background: white;
            padding: 10px 15px;
            border-radius: 15px;
            border-bottom-left-radius: 4px;
            display: none;
        }
        
        .dots {
            display: flex;
            gap: 4px;
        }
        
        .dot {
            width: 8px;
            height: 8px;
            background: #ccc;
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
        }
        
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }

        /* Input Area */
        .chat-input-area {
            padding: 15px;
            background: white;
            border-top: 1px solid rgba(0,0,0,0.05);
            display: flex;
            gap: 10px;
        }

        .chat-input {
            flex: 1;
            border: 1px solid #eee;
            border-radius: 30px;
            padding: 10px 20px;
            font-family: inherit;
            outline: none;
            transition: 0.3s;
            background: #f8f9fa;
        }

        .chat-input:focus {
            border-color: #4361ee;
            background: white;
        }

        .chat-send {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: #4361ee;
            color: white;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: 0.3s;
        }

        .chat-send:hover {
            transform: scale(1.1);
            background: #3f37c9;
        }

        .sky-blue-ai {
            color: #87CEEB !important;
        }
    `;
    document.head.appendChild(style);

    // 2. Inject HTML UI
    const container = document.createElement('div');
    container.className = 'chat-widget-container';
    container.innerHTML = `
        <div class="chat-window" id="chatWindow">
            <div class="chat-header">
                <div>
                    <h5>fakejob<span class="sky-blue-ai">ai</span> Assistant</h5>
                    <small style="opacity: 0.8; font-size: 0.75rem;">Online • Powered by JS <span class="sky-blue-ai">AI</span></small>
                </div>
                <button class="chat-close" id="chatCloseBtn"><i class="fas fa-times"></i></button>
            </div>
            <div class="chat-messages" id="chatMessages">
                <!-- Welcome Message -->
                <div class="message bot">
                    Hi! I'm fakejob<span class="sky-blue-ai">ai</span> 🛡️. I can help you spot job scams or answer security questions. How can I help?
                </div>
                <div class="typing-indicator" id="typingIndicator">
                    <div class="dots">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                </div>
            </div>
            <div class="chat-input-area">
                <input type="text" class="chat-input" id="chatInput" placeholder="Ask a question..." autocomplete="off">
                <button class="chat-send" id="chatSendBtn"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
        <button class="chat-toggle-btn" id="chatToggleBtn">
            <img src="assets/images/job-guard-logo.png" alt="AI">
            <span class="notification-dot" id="chatNotify"></span>
        </button>
    `;
    document.body.appendChild(container);

    // 3. Logic
    const toggleBtn = document.getElementById('chatToggleBtn');
    const chatWindow = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('chatCloseBtn');
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const messagesContainer = document.getElementById('chatMessages');
    const typing = document.getElementById('typingIndicator');
    const notifyDot = document.getElementById('chatNotify');
    const chatIcon = document.getElementById('chatIcon');

    let history = []; // Keep track of local convo
    let isOpen = false;

    // Toggle Window
    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            chatWindow.classList.add('open');
            notifyDot.style.display = 'none';
            input.focus();
        } else {
            chatWindow.classList.remove('open');
        }
    }

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', () => {
        isOpen = false;
        chatWindow.classList.remove('open');
    });

    // Send Message
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        // 1. User Message UI
        appendMessage(text, 'user');
        input.value = '';
        history.push({ role: 'user', content: text });

        // 2. Show Typing
        showTyping(true);

        try {
            // 3. API Call
            // 3. API Call
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                // body is URLSearchParams, so Content-Type will be application/x-www-form-urlencoded automatically
                body: new URLSearchParams({ message: text })
            });

            const data = await response.json();

            showTyping(false);

            if (data.reply) {
                appendMessage(data.reply, 'bot');
                history.push({ role: 'assistant', content: data.reply });
            } else {
                appendMessage("I'm having trouble connecting right now.", 'bot');
            }

        } catch (err) {
            showTyping(false);
            console.error(err);
            appendMessage("Server connection failed. Is the backend running?", 'bot');
        }
    }

    // UI Helpers
    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;

        // Insert before typing indicator
        messagesContainer.insertBefore(msgDiv, typing);
        scrollToBottom();
    }

    function showTyping(show) {
        typing.style.display = show ? 'block' : 'none';
        scrollToBottom();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Event Listeners for Send
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

})();
