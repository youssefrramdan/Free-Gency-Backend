// Configuration
const API_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api'
    : 'https://free-gency-backend-003bbc67b812.herokuapp.com/api';

const SOCKET_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'wss://free-gency-backend-003bbc67b812.herokuapp.com';

// Global Variables
let socket = null;
let currentUser = null;
let currentProject = null;
let typingTimeout = null;

// DOM Elements
const statusDiv = document.getElementById('status');
const userNameSpan = document.getElementById('userName');
const userAvatarSpan = document.getElementById('userAvatar');
const projectSelect = document.getElementById('projectSelect');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const logoutBtn = document.getElementById('logoutBtn');

// Utility Functions
function showStatus(message, type = 'loading') {
  statusDiv.textContent = message;
  statusDiv.className = `status status-${type}`;
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getUserInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Authentication Check
function checkAuth() {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  if (!token || !userData) {
    window.location.href = 'index.html';
    return false;
  }

  try {
    currentUser = JSON.parse(userData);
    userNameSpan.textContent = currentUser.name;
    userAvatarSpan.textContent = getUserInitials(currentUser.name);
    return token;
  } catch (error) {
    console.error('Error parsing user data:', error);
    logout();
    return false;
  }
}

// Socket.IO Functions
function initializeSocket(token) {
  showStatus('جاري الاتصال...', 'loading');

  socket = io(SOCKET_URL, {
    auth: { token: token },
    transports: ['websocket', 'polling'],
  });

  // Connection Events
  socket.on('connect', () => {
    showStatus('متصل', 'connected');
    console.log('Socket connected successfully');
  });

  socket.on('disconnect', reason => {
    showStatus(`غير متصل - ${reason}`, 'disconnected');
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', error => {
    showStatus(`خطأ في الاتصال - ${error.message}`, 'disconnected');
    console.error('Socket connection error:', error);
  });

  // Chat Events
  socket.on('joined_project', data => {
    console.log('Joined project:', data.projectId);
    loadMessages(data.projectId);
  });

  socket.on('new_message', message => {
    displayMessage(message);
    scrollToBottom();
  });

  socket.on('user_joined', data => {
    showTyping(`${data.userName} انضم للمحادثة`);
  });

  socket.on('user_left', data => {
    showTyping(`${data.userName} غادر المحادثة`);
  });

  socket.on('user_typing', data => {
    showTyping(`${data.userName} يكتب...`);
  });

  socket.on('user_stopped_typing', () => {
    hideTyping();
  });

  socket.on('error', error => {
    console.error('Socket error:', error);
    showStatus(`خطأ: ${error.message}`, 'disconnected');
  });
}

// Load User Projects
async function loadUserProjects() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/v1/chat/my-chats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      const projects = result.data || []; // Extract data array from response
      populateProjectSelect(projects);
    } else {
      console.error('Failed to load projects');
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

// Populate Project Select
function populateProjectSelect(projects) {
  if (!projects || projects.length === 0) {
    projectSelect.innerHTML = '<option value="">لا توجد مشاريع متاحة</option>';
    return;
  }

  projectSelect.innerHTML = '<option value="">اختر مشروع...</option>';

  projects.forEach(project => {
    const option = document.createElement('option');
    option.value = project.projectId;
    option.textContent = project.projectTitle || `مشروع ${project.projectId}`;
    projectSelect.appendChild(option);
  });
}

// Join Project
function joinProject(projectId) {
  if (!socket || !socket.connected) {
    showStatus('غير متصل', 'disconnected');
    return;
  }

  if (currentProject) {
    socket.emit('leave_project', { projectId: currentProject });
  }

  currentProject = projectId;
  socket.emit('join_project', { projectId });
  clearMessages();
  showStatus(`متصل - ${projectId}`, 'connected');

  // Enable message input
  messageInput.disabled = false;
  sendBtn.disabled = false;
  messageInput.placeholder = 'اكتب رسالتك هنا...';
}

// Load Messages
async function loadMessages(projectId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_URL}/v1/chat/project/${projectId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const result = await response.json();
      const messages = result.data?.messages || []; // Extract messages from response
      displayMessages(messages);
    }
  } catch (error) {
    console.error('Error loading messages:', error);
  }
}

// Display Messages
function displayMessages(messages) {
  clearMessages();
  messages.forEach(message => displayMessage(message));
  scrollToBottom();
}

// Display Single Message
function displayMessage(message) {
  const messageDiv = document.createElement('div');
  const isOwn = message.senderId === currentUser._id;

  messageDiv.className = `message ${isOwn ? 'own' : ''}`;

  const timeStr = new Date(message.timestamp).toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  messageDiv.innerHTML = `
    <div class="message-bubble">
      ${!isOwn ? `<div class="message-info">${message.senderName} - ${timeStr}</div>` : `<div class="message-info">${timeStr}</div>`}
      <div>${message.text}</div>
    </div>
  `;

  messagesContainer.appendChild(messageDiv);
}

// Send Message
function sendMessage() {
  const text = messageInput.value.trim();

  if (!text || !currentProject) {
    return;
  }

  if (!socket || !socket.connected) {
    showStatus('غير متصل', 'disconnected');
    return;
  }

  socket.emit('send_message', {
    projectId: currentProject,
    text: text,
    type: 'text',
  });

  messageInput.value = '';
  stopTyping();
}

// Typing Functions
function startTyping() {
  if (!currentProject || !socket || !socket.connected) return;

  socket.emit('typing_start', { projectId: currentProject });

  // Auto stop typing after 3 seconds
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    stopTyping();
  }, 3000);
}

function stopTyping() {
  if (!currentProject || !socket || !socket.connected) return;

  socket.emit('typing_stop', { projectId: currentProject });
  clearTimeout(typingTimeout);
}

function showTyping(message) {
  typingIndicator.textContent = message;
  typingIndicator.style.display = 'block';
  setTimeout(() => {
    hideTyping();
  }, 3000);
}

function hideTyping() {
  typingIndicator.style.display = 'none';
}

// UI Functions
function clearMessages() {
  messagesContainer.innerHTML = '';
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Logout
function logout() {
  if (socket) {
    socket.disconnect();
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const token = checkAuth();
  if (token) {
    initializeSocket(token);
    loadUserProjects();
  }
});

projectSelect.addEventListener('change', e => {
  const projectId = e.target.value;
  if (projectId) {
    joinProject(projectId);
  }
});

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    sendMessage();
  } else {
    startTyping();
  }
});

messageInput.addEventListener('input', () => {
  if (messageInput.value.trim()) {
    startTyping();
  } else {
    stopTyping();
  }
});

logoutBtn.addEventListener('click', logout);

// Prevent page unload without cleanup
window.addEventListener('beforeunload', () => {
  if (socket) {
    socket.disconnect();
  }
});
