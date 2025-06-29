// API Configuration
const API_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api'
    : 'https://free-gency-backend-003bbc67b812.herokuapp.com/api';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');
const errorDiv = document.getElementById('errorMessage');
const loadingDiv = document.getElementById('loading');

// Show/Hide Elements
function showElement(element) {
  element.style.display = 'block';
}

function hideElement(element) {
  element.style.display = 'none';
}

// Show Error Message
function showError(message) {
  errorDiv.textContent = message;
  errorDiv.className = 'status status-disconnected';
  showElement(errorDiv);
}

// Show Success Message
function showSuccess(message) {
  errorDiv.textContent = message;
  errorDiv.className = 'status status-connected';
  showElement(errorDiv);
}

// Show Loading
function showLoading() {
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> جاري تسجيل الدخول...';
  showElement(loadingDiv);
}

// Hide Loading
function hideLoading() {
  submitBtn.disabled = false;
  submitBtn.innerHTML = 'تسجيل الدخول';
  hideElement(loadingDiv);
}

// Login Function
async function login(email, password) {
  try {
    showLoading();
    hideElement(errorDiv);

    const response = await fetch(`${API_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showSuccess('تم تسجيل الدخول بنجاح! جاري التحويل...');

      // Redirect to chat page after 1 second
      setTimeout(() => {
        window.location.href = 'chat.html';
      }, 1000);
    } else {
      showError(data.message || 'خطأ في تسجيل الدخول');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('خطأ في الاتصال بالخادم');
  } finally {
    hideLoading();
  }
}

// Form Submit Handler
loginForm.addEventListener('submit', async e => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // Validation
  if (!email || !password) {
    showError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
    return;
  }

  if (!email.includes('@')) {
    showError('يرجى إدخال بريد إلكتروني صحيح');
    return;
  }

  await login(email, password);
});

// Check if already logged in
window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (token && user) {
    showSuccess('مرحباً! لديك جلسة نشطة. جاري التحويل...');
    setTimeout(() => {
      window.location.href = 'chat.html';
    }, 1000);
  }
});

// Demo Login (for testing)
function demoLogin() {
  emailInput.value = 'test@example.com';
  passwordInput.value = 'password123';
  showSuccess('تم ملء بيانات تجريبية. اضغط تسجيل الدخول للمتابعة.');
}
