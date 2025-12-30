const chatBody = document.getElementById('chatBody');
const userInput = document.getElementById('userInput');

// Send message when clicking the button or pressing Enter
userInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMsg();
  }
});

function sendMsg() {
  const msg = userInput.value.trim();
  if (!msg) return;

  // User message
  const userMsg = document.createElement('p');
  userMsg.classList.add('user-msg');
  userMsg.innerHTML = `<strong>You:</strong> ${msg}`;
  chatBody.appendChild(userMsg);
  chatBody.scrollTop = chatBody.scrollHeight;

  userInput.value = '';

  // AI response placeholder (replace with backend API fetch)
  setTimeout(() => {
    const aiMsg = document.createElement('p');
    aiMsg.innerHTML = `<strong>Fakejob<span class="sky-blue-ai">AI</span> Assistant:</strong> This is a reply to "${msg}"`;
    chatBody.appendChild(aiMsg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 700);
}

// Toggle chatbox
function toggleChat() {
  const chatBox = document.getElementById('chatbotBox');
  chatBox.style.display = chatBox.style.display === 'block' ? 'none' : 'block';
}
