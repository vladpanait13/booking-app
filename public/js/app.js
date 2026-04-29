// Main Application Controller
let currentUser = null;
let currentPage = 'home';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  handleRoute();
  
  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-user') && !e.target.closest('.user-dropdown')) {
      document.getElementById('user-dropdown').classList.remove('active');
    }
  });
});

// Check if user is logged in
async function checkAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      currentUser = await api.getMe();
      updateNavForUser();
    } catch (err) {
      localStorage.removeItem('token');
      currentUser = null;
    }
  }
}

// Update navigation for logged-in user
function updateNavForUser() {
  const guestMenu = document.getElementById('guest-menu');
  const userMenu = document.getElementById('user-menu');
  const navAvatar = document.getElementById('nav-avatar');

  if (currentUser) {
    guestMenu.style.display = 'none';
    userMenu.style.display = 'block';
    navAvatar.innerHTML = currentUser.firstName ? currentUser.firstName[0].toUpperCase() : '<i class="fas fa-user"></i>';
    navAvatar.style.background = '#FF385C';
  } else {
    guestMenu.style.display = 'block';
    userMenu.style.display = 'none';
    navAvatar.innerHTML = '<i class="fas fa-user"></i>';
    navAvatar.style.background = '#555';
  }
}

// Navigation
function navigate(page, params = {}) {
  currentPage = page;
  window.history.pushState({ page, params }, '', `/${page === 'home' ? '' : page}${params.id ? '/' + params.id : ''}`);
  renderPage(page, params);
  window.scrollTo(0, 0);
  document.getElementById('user-dropdown').classList.remove('active');
}

function handleRoute() {
  const path = window.location.pathname;
  if (path === '/' || path === '') {
    renderPage('home');
  } else if (path.startsWith('/property/')) {
    const id = path.split('/')[2];
    renderPage('property', { id });
  } else {
    const page = path.substring(1).split('/')[0];
    renderPage(page);
  }
}

window.onpopstate = (event) => {
  if (event.state) {
    renderPage(event.state.page, event.state.params || {});
  } else {
    handleRoute();
  }
};

// User menu toggle
function toggleUserMenu() {
  document.getElementById('user-dropdown').classList.toggle('active');
}

// Auth Modal
function openAuthModal(type) {
  document.getElementById('auth-modal').classList.add('active');
  document.getElementById('user-dropdown').classList.remove('active');
  
  if (type === 'login') {
    document.getElementById('login-form-container').style.display = 'block';
    document.getElementById('register-form-container').style.display = 'none';
  } else {
    document.getElementById('login-form-container').style.display = 'none';
    document.getElementById('register-form-container').style.display = 'block';
  }
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.remove('active');
  document.getElementById('login-error').textContent = '';
  document.getElementById('register-error').textContent = '';
}

// Search Modal
function openSearchModal() {
  document.getElementById('search-modal').classList.add('active');
}

function closeSearchModal() {
  document.getElementById('search-modal').classList.remove('active');
}

// Login Handler
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  try {
    const data = await api.login(email, password);
    currentUser = data.user;
    updateNavForUser();
    closeAuthModal();
    showToast('Welcome back, ' + currentUser.firstName + '!', 'success');
    renderPage(currentPage);
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

// Register Handler
async function handleRegister(e) {
  e.preventDefault();
  const errorEl = document.getElementById('register-error');

  const userData = {
    firstName: document.getElementById('register-firstname').value,
    lastName: document.getElementById('register-lastname').value,
    email: document.getElementById('register-email').value,
    phone: document.getElementById('register-phone').value,
    password: document.getElementById('register-password').value,
  };

  try {
    const data = await api.register(userData);
    currentUser = data.user;
    updateNavForUser();
    closeAuthModal();
    showToast('Welcome to StayBooker, ' + currentUser.firstName + '!', 'success');
    renderPage(currentPage);
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

// Logout
function logout() {
  api.setToken(null);
  currentUser = null;
  updateNavForUser();
  navigate('home');
  showToast('You have been logged out');
}

// Search
function performSearch(e) {
  e.preventDefault();
  const params = {};
  
  const location = document.getElementById('search-location').value;
  if (location) params.search = location;
  
  const type = document.getElementById('search-type').value;
  if (type) params.type = type;
  
  const minPrice = document.getElementById('search-min-price').value;
  if (minPrice) params.minPrice = minPrice;
  
  const maxPrice = document.getElementById('search-max-price').value;
  if (maxPrice) params.maxPrice = maxPrice;
  
  const guests = document.getElementById('search-guests').value;
  if (guests) params.guests = guests;
  
  const bedrooms = document.getElementById('search-bedrooms').value;
  if (bedrooms) params.bedrooms = bedrooms;

  closeSearchModal();
  navigate('home', params);
}

// Toast Notifications
function showToast(message, type = '') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Utility Functions
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount) {
  return '$' + Number(amount).toFixed(0);
}

function getAmenityIcon(amenity) {
  const icons = {
    'WiFi': 'fas fa-wifi',
    'Kitchen': 'fas fa-utensils',
    'Air conditioning': 'fas fa-snowflake',
    'Heating': 'fas fa-temperature-high',
    'Washer': 'fas fa-tshirt',
    'Dryer': 'fas fa-wind',
    'TV': 'fas fa-tv',
    'Pool': 'fas fa-swimming-pool',
    'Hot tub': 'fas fa-hot-tub',
    'Gym': 'fas fa-dumbbell',
    'Parking': 'fas fa-car',
    'Elevator': 'fas fa-building',
    'Fireplace': 'fas fa-fire',
    'BBQ': 'fas fa-fire-alt',
    'Garden': 'fas fa-leaf',
    'Beach access': 'fas fa-umbrella-beach',
    'Ocean view': 'fas fa-water',
    'Mountain view': 'fas fa-mountain',
    'City view': 'fas fa-city',
    'Workspace': 'fas fa-laptop',
    'Coffee maker': 'fas fa-coffee',
    'Outdoor shower': 'fas fa-shower',
    'Hiking': 'fas fa-hiking',
    'Bike storage': 'fas fa-bicycle',
    'Kid-friendly': 'fas fa-baby',
    'Breakfast included': 'fas fa-egg',
    'Eco-friendly': 'fas fa-seedling',
    'Smart home': 'fas fa-home',
    'Terrace': 'fas fa-border-all',
    'Surfboards': 'fas fa-water',
  };
  return icons[amenity] || 'fas fa-check';
}
