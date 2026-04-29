// Page Rendering Functions

function renderPage(page, params = {}) {
  const main = document.getElementById('main-content');
  
  switch (page) {
    case 'home':
      renderHomePage(main, params);
      break;
    case 'property':
      renderPropertyPage(main, params);
      break;
    case 'trips':
      renderTripsPage(main);
      break;
    case 'favorites':
      renderFavoritesPage(main);
      break;
    case 'messages':
      renderMessagesPage(main);
      break;
    case 'host':
      renderHostPage(main);
      break;
    case 'hosting':
      renderHostingPage(main);
      break;
    case 'profile':
      renderProfilePage(main);
      break;
    default:
      renderHomePage(main, params);
  }
}

// ========================
// HOME PAGE
// ========================
async function renderHomePage(container, params = {}) {
  container.innerHTML = `
    <div class="hero-section">
      <h1>Find your next stay</h1>
      <p>Discover unique homes, apartments, and experiences around the world</p>
      <button class="btn btn-secondary btn-lg" onclick="openSearchModal()">
        <i class="fas fa-search"></i> Start your search
      </button>
    </div>
    <div class="category-bar">
      <div class="category-item active" onclick="filterByType('')"><i class="fas fa-globe"></i><span>All</span></div>
      <div class="category-item" onclick="filterByType('apartment')"><i class="fas fa-building"></i><span>Apartments</span></div>
      <div class="category-item" onclick="filterByType('house')"><i class="fas fa-home"></i><span>Houses</span></div>
      <div class="category-item" onclick="filterByType('villa')"><i class="fas fa-hotel"></i><span>Villas</span></div>
      <div class="category-item" onclick="filterByType('cabin')"><i class="fas fa-tree"></i><span>Cabins</span></div>
      <div class="category-item" onclick="filterByType('studio')"><i class="fas fa-door-open"></i><span>Studios</span></div>
      <div class="category-item" onclick="filterByType('loft')"><i class="fas fa-warehouse"></i><span>Lofts</span></div>
      <div class="category-item" onclick="filterByType('cottage')"><i class="fas fa-house-user"></i><span>Cottages</span></div>
      <div class="category-item" onclick="filterByType('hotel')"><i class="fas fa-concierge-bell"></i><span>Hotels</span></div>
    </div>
    <section class="properties-section">
      <div class="properties-grid" id="properties-grid">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </section>
  `;

  try {
    const data = await api.getProperties(params);
    const grid = document.getElementById('properties-grid');
    
    if (data.properties.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <i class="fas fa-search"></i>
          <h3>No properties found</h3>
          <p>Try adjusting your search criteria</p>
          <button class="btn btn-primary" onclick="navigate('home')">View all properties</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = data.properties.map(property => createPropertyCard(property)).join('');
  } catch (err) {
    document.getElementById('properties-grid').innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Error loading properties</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

function filterByType(type) {
  // Update active category
  document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
  event.currentTarget.classList.add('active');
  
  const params = type ? { type } : {};
  loadProperties(params);
}

async function loadProperties(params = {}) {
  const grid = document.getElementById('properties-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const data = await api.getProperties(params);
    if (data.properties.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <i class="fas fa-search"></i>
          <h3>No properties found</h3>
          <p>Try a different category</p>
        </div>
      `;
      return;
    }
    grid.innerHTML = data.properties.map(property => createPropertyCard(property)).join('');
  } catch (err) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><p>Error loading properties</p></div>';
  }
}

function createPropertyCard(property) {
  return `
    <div class="property-card" onclick="navigate('property', {id: ${property.id}})">
      <div class="property-card-image">
        <img src="${property.thumbnail}" alt="${property.title}" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'">
        <button class="property-card-favorite ${property.isFavorited ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${property.id}, this)">
          <i class="fas fa-heart"></i>
        </button>
        ${property.rating >= 4.9 ? '<span class="property-card-badge">Guest favorite</span>' : ''}
      </div>
      <div class="property-card-info">
        <div class="property-card-header">
          <span class="property-card-location">${property.city}, ${property.country}</span>
          ${property.rating > 0 ? `<span class="property-card-rating"><i class="fas fa-star"></i> ${property.rating}</span>` : ''}
        </div>
        <div class="property-card-type">${property.type.charAt(0).toUpperCase() + property.type.slice(1)} · ${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''} · ${property.bathrooms} bath${property.bathrooms > 1 ? 's' : ''}</div>
        <div class="property-card-dates">${property.maxGuests} guest${property.maxGuests > 1 ? 's' : ''} max</div>
        <div class="property-card-price"><strong>${formatCurrency(property.pricePerNight)}</strong> / night</div>
      </div>
    </div>
  `;
}

async function toggleFavorite(propertyId, btn) {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }
  try {
    const result = await api.toggleFavorite(propertyId);
    btn.classList.toggle('active', result.isFavorited);
    showToast(result.isFavorited ? 'Added to wishlist' : 'Removed from wishlist', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========================
// PROPERTY DETAIL PAGE
// ========================
async function renderPropertyPage(container, params) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const property = await api.getProperty(params.id);
    
    const images = property.images && property.images.length > 0 
      ? property.images 
      : [property.thumbnail, property.thumbnail, property.thumbnail];

    container.innerHTML = `
      <div class="property-detail">
        <h1 class="property-detail-title">${property.title}</h1>
        <div class="property-detail-meta">
          <span><i class="fas fa-star"></i> ${property.rating} (${property.reviewCount} reviews)</span>
          <span><i class="fas fa-map-marker-alt"></i> ${property.city}, ${property.country}</span>
          <button class="btn btn-sm btn-secondary" onclick="toggleFavoriteDetail(${property.id})">
            <i class="fa${property.isFavorited ? 's' : 'r'} fa-heart"></i> ${property.isFavorited ? 'Saved' : 'Save'}
          </button>
        </div>

        <div class="property-images">
          <img src="${property.thumbnail}" alt="" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'">
          <img src="${property.thumbnail}" alt="" onerror="this.src='https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'">
          <img src="${property.thumbnail}" alt="" onerror="this.src='https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&h=600&fit=crop'">
        </div>

        <div class="property-detail-content">
          <div class="property-detail-left">
            <div class="property-host-info">
              <div class="property-host-avatar"><i class="fas fa-user"></i></div>
              <div>
                <div class="property-host-name">${property.type.charAt(0).toUpperCase() + property.type.slice(1)} hosted by ${property.hostFirstName} ${property.hostLastName}</div>
                <div class="property-host-detail">${property.maxGuests} guests · ${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''} · ${property.beds} bed${property.beds > 1 ? 's' : ''} · ${property.bathrooms} bath${property.bathrooms > 1 ? 's' : ''}</div>
              </div>
            </div>

            <div class="property-highlights">
              <div class="highlight-item">
                <i class="fas fa-door-open"></i>
                <div>
                  <h4>Self check-in</h4>
                  <p>Check yourself in with the lockbox.</p>
                </div>
              </div>
              <div class="highlight-item">
                <i class="fas fa-map-marker-alt"></i>
                <div>
                  <h4>Great location</h4>
                  <p>95% of recent guests gave the location a 5-star rating.</p>
                </div>
              </div>
              <div class="highlight-item">
                <i class="fas fa-calendar-check"></i>
                <div>
                  <h4>Free cancellation before check-in</h4>
                  <p>Get a full refund if you change your plans.</p>
                </div>
              </div>
            </div>

            <div class="property-description">
              <h3>About this place</h3>
              <p>${property.description}</p>
            </div>

            <div class="property-amenities">
              <h3>What this place offers</h3>
              <div class="amenities-grid">
                ${property.amenities.map(a => `
                  <div class="amenity-item">
                    <i class="${getAmenityIcon(a)}"></i>
                    <span>${a}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            ${property.reviews && property.reviews.length > 0 ? `
              <div class="reviews-section">
                <h3><i class="fas fa-star"></i> ${property.rating} · ${property.reviewCount} reviews</h3>
                <div class="reviews-grid">
                  ${property.reviews.map(review => `
                    <div class="review-card">
                      <div class="review-header">
                        <div class="review-avatar"><i class="fas fa-user"></i></div>
                        <div>
                          <div class="review-author">${review.firstName} ${review.lastName}</div>
                          <div class="review-date">${formatDate(review.createdAt)}</div>
                        </div>
                      </div>
                      <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                      <p class="review-text">${review.comment || 'Great stay!'}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <div class="booking-card">
            <div class="booking-card-price">
              <span class="price">${formatCurrency(property.pricePerNight)}</span>
              <span class="per-night">/ night</span>
            </div>
            
            <div class="booking-card-dates">
              <div class="booking-card-dates-row">
                <div>
                  <label>CHECK-IN</label>
                  <input type="date" id="booking-checkin" min="${new Date().toISOString().split('T')[0]}" onchange="updateBookingTotal(${property.pricePerNight})">
                </div>
                <div>
                  <label>CHECK-OUT</label>
                  <input type="date" id="booking-checkout" min="${new Date().toISOString().split('T')[0]}" onchange="updateBookingTotal(${property.pricePerNight})">
                </div>
              </div>
              <div class="booking-card-guests">
                <label>GUESTS</label>
                <select id="booking-guests">
                  ${Array.from({length: property.maxGuests}, (_, i) => `<option value="${i+1}">${i+1} guest${i > 0 ? 's' : ''}</option>`).join('')}
                </select>
              </div>
            </div>

            <div id="booking-total"></div>

            <button class="btn btn-primary btn-block btn-lg" onclick="handleBooking(${property.id}, ${property.hostId}, ${property.pricePerNight})">
              Reserve
            </button>
            <p style="text-align:center; margin-top:12px; color:var(--gray-500); font-size:0.85rem;">You won't be charged yet</p>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Property not found</h3>
        <p>${err.message}</p>
        <button class="btn btn-primary" onclick="navigate('home')">Back to home</button>
      </div>
    `;
  }
}

function updateBookingTotal(pricePerNight) {
  const checkIn = document.getElementById('booking-checkin').value;
  const checkOut = document.getElementById('booking-checkout').value;
  const totalDiv = document.getElementById('booking-total');

  if (checkIn && checkOut) {
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    if (nights > 0) {
      const subtotal = pricePerNight * nights;
      const serviceFee = Math.round(subtotal * 0.12);
      const total = subtotal + serviceFee;

      totalDiv.innerHTML = `
        <div class="booking-card-total">
          <div class="booking-price-row">
            <span>${formatCurrency(pricePerNight)} × ${nights} night${nights > 1 ? 's' : ''}</span>
            <span>${formatCurrency(subtotal)}</span>
          </div>
          <div class="booking-price-row">
            <span>Service fee</span>
            <span>${formatCurrency(serviceFee)}</span>
          </div>
          <div class="booking-price-row total">
            <span>Total</span>
            <span>${formatCurrency(total)}</span>
          </div>
        </div>
      `;
    } else {
      totalDiv.innerHTML = '<p style="color:var(--error); font-size:0.85rem; margin-top:8px;">Check-out must be after check-in</p>';
    }
  }
}

async function handleBooking(propertyId, hostId, pricePerNight) {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  const checkIn = document.getElementById('booking-checkin').value;
  const checkOut = document.getElementById('booking-checkout').value;
  const guests = document.getElementById('booking-guests').value;

  if (!checkIn || !checkOut) {
    showToast('Please select check-in and check-out dates', 'error');
    return;
  }

  try {
    await api.createBooking({ propertyId, checkIn, checkOut, guests: Number(guests) });
    showToast('Booking request sent successfully!', 'success');
    navigate('trips');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleFavoriteDetail(propertyId) {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }
  try {
    const result = await api.toggleFavorite(propertyId);
    showToast(result.isFavorited ? 'Added to wishlist' : 'Removed from wishlist', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========================
// TRIPS PAGE
// ========================
async function renderTripsPage(container) {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  container.innerHTML = `
    <div class="page-container">
      <h1 class="page-title">My Trips</h1>
      <div class="tabs">
        <div class="tab active" onclick="loadTrips('', this)">All</div>
        <div class="tab" onclick="loadTrips('confirmed', this)">Upcoming</div>
        <div class="tab" onclick="loadTrips('completed', this)">Completed</div>
        <div class="tab" onclick="loadTrips('cancelled', this)">Cancelled</div>
      </div>
      <div id="trips-list">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  loadTrips('');
}

async function loadTrips(status, tabEl) {
  if (tabEl) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');
  }

  const listEl = document.getElementById('trips-list');
  listEl.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const bookings = await api.getMyTrips(status);
    
    if (bookings.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-suitcase"></i>
          <h3>No trips yet</h3>
          <p>Time to dust off your bags and start planning your next adventure</p>
          <button class="btn btn-primary" onclick="navigate('home')">Start exploring</button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = bookings.map(booking => `
      <div class="booking-list-item">
        <div class="booking-list-image">
          <img src="${booking.propertyThumbnail}" alt="" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'">
        </div>
        <div class="booking-list-info">
          <h3>${booking.propertyTitle}</h3>
          <div class="location">${booking.propertyCity}, ${booking.propertyCountry}</div>
          <div class="booking-list-details">
            <span><i class="fas fa-calendar"></i> ${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}</span>
            <span><i class="fas fa-users"></i> ${booking.guests} guest${booking.guests > 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="booking-list-actions">
          <span class="booking-status ${booking.status}">${booking.status}</span>
          <span class="booking-list-price">${formatCurrency(booking.totalPrice)}</span>
          ${booking.status === 'pending' || booking.status === 'confirmed' ? 
            `<button class="btn btn-sm btn-secondary" onclick="cancelBooking(${booking.id})">Cancel</button>` : ''}
          ${booking.status === 'completed' ? 
            `<button class="btn btn-sm btn-primary" onclick="openReviewForm(${booking.id}, ${booking.propertyId})">Leave Review</button>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state"><p>Error loading trips: ${err.message}</p></div>`;
  }
}

async function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;
  
  try {
    await api.updateBookingStatus(bookingId, 'cancelled');
    showToast('Booking cancelled', 'success');
    loadTrips('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openReviewForm(bookingId, propertyId) {
  const modal = document.getElementById('auth-modal');
  modal.classList.add('active');
  
  document.querySelector('.auth-modal-content').innerHTML = `
    <button class="modal-close" onclick="closeAuthModal()"><i class="fas fa-times"></i></button>
    <h2>Leave a Review</h2>
    <p class="modal-subtitle">Share your experience with other travelers</p>
    <form onsubmit="submitReview(event, ${bookingId}, ${propertyId})">
      <div class="form-group">
        <label>Overall Rating</label>
        <select id="review-rating" required>
          <option value="5">★★★★★ Excellent</option>
          <option value="4">★★★★☆ Great</option>
          <option value="3">★★★☆☆ Good</option>
          <option value="2">★★☆☆☆ Fair</option>
          <option value="1">★☆☆☆☆ Poor</option>
        </select>
      </div>
      <div class="form-group">
        <label>Your Review</label>
        <textarea id="review-comment" placeholder="Tell others about your experience..." rows="4"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Cleanliness</label>
          <select id="review-cleanliness"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select>
        </div>
        <div class="form-group">
          <label>Communication</label>
          <select id="review-communication"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Location</label>
          <select id="review-location"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select>
        </div>
        <div class="form-group">
          <label>Value</label>
          <select id="review-value"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select>
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">Submit Review</button>
    </form>
  `;
}

async function submitReview(e, bookingId, propertyId) {
  e.preventDefault();
  
  try {
    await api.createReview({
      bookingId,
      propertyId,
      rating: Number(document.getElementById('review-rating').value),
      comment: document.getElementById('review-comment').value,
      cleanlinessRating: Number(document.getElementById('review-cleanliness').value),
      communicationRating: Number(document.getElementById('review-communication').value),
      locationRating: Number(document.getElementById('review-location').value),
      valueRating: Number(document.getElementById('review-value').value),
    });
    
    closeAuthModal();
    showToast('Review submitted successfully!', 'success');
    // Restore modal content
    location.reload();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========================
// FAVORITES PAGE
// ========================
async function renderFavoritesPage(container) {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  container.innerHTML = `
    <div class="page-container">
      <h1 class="page-title">Wishlists</h1>
      <div class="properties-grid" id="favorites-grid">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  try {
    const favorites = await api.getFavorites();
    const grid = document.getElementById('favorites-grid');
    
    if (favorites.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <i class="fas fa-heart"></i>
          <h3>No saved properties yet</h3>
          <p>Click the heart icon on any property to add it to your wishlist</p>
          <button class="btn btn-primary" onclick="navigate('home')">Explore properties</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = favorites.map(property => createPropertyCard({ ...property, isFavorited: true })).join('');
  } catch (err) {
    document.getElementById('favorites-grid').innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>Error: ${err.message}</p></div>`;
  }
}

// ========================
// MESSAGES PAGE
// ========================
async function renderMessagesPage(container) {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  container.innerHTML = `
    <div class="page-container">
      <h1 class="page-title">Messages</h1>
      <div class="messages-container">
        <div class="messages-sidebar">
          <div class="messages-sidebar-header">Inbox</div>
          <div id="conversations-list">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="messages-chat">
          <div class="messages-chat-header" id="chat-header">Select a conversation</div>
          <div class="messages-chat-body" id="chat-body">
            <div class="empty-state">
              <i class="fas fa-comments"></i>
              <h3>No conversation selected</h3>
              <p>Choose a conversation from the sidebar</p>
            </div>
          </div>
          <div class="messages-chat-input" id="chat-input" style="display:none;">
            <input type="text" id="message-input" placeholder="Type a message..." onkeypress="if(event.key==='Enter')sendMessageToUser()">
            <button class="btn btn-primary" onclick="sendMessageToUser()"><i class="fas fa-paper-plane"></i></button>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const conversations = await api.getConversations();
    const listEl = document.getElementById('conversations-list');
    
    if (conversations.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><p>No messages yet</p></div>';
      return;
    }

    listEl.innerHTML = conversations.map(conv => `
      <div class="conversation-item" onclick="loadConversation(${conv.userId}, '${conv.firstName} ${conv.lastName}')">
        <div class="conversation-avatar"><i class="fas fa-user"></i></div>
        <div class="conversation-info">
          <div class="conversation-name">${conv.firstName} ${conv.lastName}</div>
          <div class="conversation-preview">${conv.lastMessage || ''}</div>
        </div>
        ${conv.unreadCount > 0 ? '<div class="conversation-unread"></div>' : ''}
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('conversations-list').innerHTML = `<p style="padding:20px;">Error: ${err.message}</p>`;
  }
}

let currentChatUserId = null;

async function loadConversation(userId, name) {
  currentChatUserId = userId;
  document.getElementById('chat-header').textContent = name;
  document.getElementById('chat-input').style.display = 'flex';

  // Highlight active conversation
  document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
  event.currentTarget.classList.add('active');

  const body = document.getElementById('chat-body');
  body.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const messages = await api.getConversation(userId);
    body.innerHTML = messages.map(msg => `
      <div class="message-bubble ${msg.senderId === currentUser.id ? 'sent' : 'received'}">
        ${msg.content}
        <div class="message-time">${formatDate(msg.createdAt)}</div>
      </div>
    `).join('') || '<div class="empty-state"><p>No messages yet. Start the conversation!</p></div>';
    
    body.scrollTop = body.scrollHeight;
  } catch (err) {
    body.innerHTML = `<p style="padding:20px;">Error loading messages</p>`;
  }
}

async function sendMessageToUser() {
  if (!currentChatUserId) return;
  const input = document.getElementById('message-input');
  const content = input.value.trim();
  if (!content) return;

  try {
    await api.sendMessage({ receiverId: currentChatUserId, content });
    input.value = '';
    loadConversation(currentChatUserId, document.getElementById('chat-header').textContent);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========================
// HOST PAGE (Create/Manage Listings)
// ========================
async function renderHostPage(container) {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  container.innerHTML = `
    <div class="page-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;">
        <h1 class="page-title" style="margin-bottom:0;">Your Listings</h1>
        <button class="btn btn-primary" onclick="showCreateListingForm()"><i class="fas fa-plus"></i> New Listing</button>
      </div>
      <div id="host-listings">
        <div class="loading"><div class="spinner"></div></div>
      </div>
      <div id="listing-form-container" style="display:none;"></div>
    </div>
  `;

  try {
    const properties = await api.getMyProperties();
    const listEl = document.getElementById('host-listings');
    
    if (properties.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-home"></i>
          <h3>No listings yet</h3>
          <p>Start hosting by creating your first listing</p>
          <button class="btn btn-primary" onclick="showCreateListingForm()">Create a listing</button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = properties.map(property => `
      <div class="booking-list-item">
        <div class="booking-list-image">
          <img src="${property.thumbnail}" alt="" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'">
        </div>
        <div class="booking-list-info">
          <h3>${property.title}</h3>
          <div class="location">${property.city}, ${property.country}</div>
          <div class="booking-list-details">
            <span><i class="fas fa-dollar-sign"></i> ${formatCurrency(property.pricePerNight)}/night</span>
            <span><i class="fas fa-star"></i> ${property.rating} (${property.reviewCount} reviews)</span>
            <span><i class="fas fa-bed"></i> ${property.bedrooms} bedrooms</span>
          </div>
        </div>
        <div class="booking-list-actions">
          <span class="booking-status ${property.isActive ? 'confirmed' : 'cancelled'}">${property.isActive ? 'Active' : 'Inactive'}</span>
          <button class="btn btn-sm btn-secondary" onclick="navigate('property', {id: ${property.id}})">View</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('host-listings').innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

function showCreateListingForm() {
  document.getElementById('host-listings').style.display = 'none';
  const formContainer = document.getElementById('listing-form-container');
  formContainer.style.display = 'block';

  const amenitiesList = ['WiFi', 'Kitchen', 'Air conditioning', 'Heating', 'Washer', 'Dryer', 'TV', 'Pool', 'Hot tub', 'Gym', 'Parking', 'Elevator', 'Fireplace', 'BBQ', 'Garden', 'Beach access', 'Ocean view', 'Mountain view', 'City view', 'Workspace', 'Coffee maker'];

  formContainer.innerHTML = `
    <div class="listing-form">
      <h2>Create New Listing</h2>
      <form onsubmit="handleCreateListing(event)">
        <div class="form-group">
          <label>Title *</label>
          <input type="text" id="listing-title" required placeholder="Give your place a catchy title">
        </div>
        <div class="form-group">
          <label>Description *</label>
          <textarea id="listing-description" required placeholder="Describe what makes your place special"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Property Type *</label>
            <select id="listing-type" required>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
              <option value="cabin">Cabin</option>
              <option value="studio">Studio</option>
              <option value="loft">Loft</option>
              <option value="cottage">Cottage</option>
              <option value="hotel">Hotel Room</option>
            </select>
          </div>
          <div class="form-group">
            <label>Price per Night ($) *</label>
            <input type="number" id="listing-price" required min="1" placeholder="100">
          </div>
        </div>
        <div class="form-group">
          <label>Address *</label>
          <input type="text" id="listing-address" required placeholder="Street address">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>City *</label>
            <input type="text" id="listing-city" required placeholder="City">
          </div>
          <div class="form-group">
            <label>Country *</label>
            <input type="text" id="listing-country" required placeholder="Country">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Max Guests</label>
            <input type="number" id="listing-guests" min="1" value="2">
          </div>
          <div class="form-group">
            <label>Bedrooms</label>
            <input type="number" id="listing-bedrooms" min="1" value="1">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Bathrooms</label>
            <input type="number" id="listing-bathrooms" min="1" value="1">
          </div>
          <div class="form-group">
            <label>Beds</label>
            <input type="number" id="listing-beds" min="1" value="1">
          </div>
        </div>
        <div class="form-group">
          <label>Image URL (thumbnail)</label>
          <input type="url" id="listing-thumbnail" placeholder="https://...">
        </div>
        <div class="form-group">
          <label>Amenities</label>
          <div class="amenities-checkboxes">
            ${amenitiesList.map(a => `
              <label class="amenity-checkbox">
                <input type="checkbox" value="${a}"> ${a}
              </label>
            `).join('')}
          </div>
        </div>
        <div style="display:flex; gap:12px; margin-top:24px;">
          <button type="submit" class="btn btn-primary btn-lg">Create Listing</button>
          <button type="button" class="btn btn-secondary btn-lg" onclick="cancelCreateListing()">Cancel</button>
        </div>
      </form>
    </div>
  `;
}

function cancelCreateListing() {
  document.getElementById('host-listings').style.display = 'block';
  document.getElementById('listing-form-container').style.display = 'none';
}

async function handleCreateListing(e) {
  e.preventDefault();

  const amenities = [];
  document.querySelectorAll('.amenity-checkbox input:checked').forEach(cb => amenities.push(cb.value));

  const propertyData = {
    title: document.getElementById('listing-title').value,
    description: document.getElementById('listing-description').value,
    type: document.getElementById('listing-type').value,
    pricePerNight: Number(document.getElementById('listing-price').value),
    address: document.getElementById('listing-address').value,
    city: document.getElementById('listing-city').value,
    country: document.getElementById('listing-country').value,
    maxGuests: Number(document.getElementById('listing-guests').value),
    bedrooms: Number(document.getElementById('listing-bedrooms').value),
    bathrooms: Number(document.getElementById('listing-bathrooms').value),
    beds: Number(document.getElementById('listing-beds').value),
    thumbnail: document.getElementById('listing-thumbnail').value || undefined,
    amenities,
  };

  try {
    await api.createProperty(propertyData);
    showToast('Listing created successfully!', 'success');
    renderHostPage(document.getElementById('main-content'));
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========================
// HOSTING PAGE (Manage Bookings as Host)
// ========================
async function renderHostingPage(container) {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  container.innerHTML = `
    <div class="page-container">
      <h1 class="page-title">Hosting Dashboard</h1>
      <div class="tabs">
        <div class="tab active" onclick="loadHostBookings('', this)">All Requests</div>
        <div class="tab" onclick="loadHostBookings('pending', this)">Pending</div>
        <div class="tab" onclick="loadHostBookings('confirmed', this)">Confirmed</div>
        <div class="tab" onclick="loadHostBookings('completed', this)">Completed</div>
      </div>
      <div id="hosting-list">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  loadHostBookings('');
}

async function loadHostBookings(status, tabEl) {
  if (tabEl) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');
  }

  const listEl = document.getElementById('hosting-list');
  listEl.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const bookings = await api.getHostBookings(status);
    
    if (bookings.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-check"></i>
          <h3>No booking requests</h3>
          <p>When guests book your property, they'll appear here</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = bookings.map(booking => `
      <div class="booking-list-item">
        <div class="booking-list-image">
          <img src="${booking.propertyThumbnail}" alt="" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'">
        </div>
        <div class="booking-list-info">
          <h3>${booking.propertyTitle}</h3>
          <div class="location">Guest: ${booking.guestFirstName} ${booking.guestLastName}</div>
          <div class="booking-list-details">
            <span><i class="fas fa-calendar"></i> ${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}</span>
            <span><i class="fas fa-users"></i> ${booking.guests} guest${booking.guests > 1 ? 's' : ''}</span>
            <span><i class="fas fa-dollar-sign"></i> ${formatCurrency(booking.totalPrice)}</span>
          </div>
        </div>
        <div class="booking-list-actions">
          <span class="booking-status ${booking.status}">${booking.status}</span>
          ${booking.status === 'pending' ? `
            <div style="display:flex; gap:8px; margin-top:8px;">
              <button class="btn btn-sm btn-primary" onclick="respondToBooking(${booking.id}, 'confirmed')">Accept</button>
              <button class="btn btn-sm btn-secondary" onclick="respondToBooking(${booking.id}, 'cancelled')">Decline</button>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
  }
}

async function respondToBooking(bookingId, status) {
  try {
    await api.updateBookingStatus(bookingId, status);
    showToast(`Booking ${status}!`, 'success');
    loadHostBookings('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========================
// PROFILE PAGE
// ========================
async function renderProfilePage(container) {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  container.innerHTML = `
    <div class="page-container">
      <h1 class="page-title">Profile</h1>
      <div class="profile-page">
        <div class="profile-card">
          <div class="profile-avatar"><i class="fas fa-user"></i></div>
          <h2>${currentUser.firstName} ${currentUser.lastName}</h2>
          <p>Member since ${formatDate(currentUser.createdAt)}</p>
          <div class="profile-stats">
            <div class="profile-stat">
              <div class="number" id="profile-reviews-count">-</div>
              <div class="label">Reviews</div>
            </div>
            <div class="profile-stat">
              <div class="number">${currentUser.isHost ? 'Yes' : 'No'}</div>
              <div class="label">Host</div>
            </div>
          </div>
        </div>
        <div>
          <div class="listing-form">
            <h2>Edit Profile</h2>
            <form onsubmit="handleUpdateProfile(event)">
              <div class="form-row">
                <div class="form-group">
                  <label>First Name</label>
                  <input type="text" id="profile-firstname" value="${currentUser.firstName}">
                </div>
                <div class="form-group">
                  <label>Last Name</label>
                  <input type="text" id="profile-lastname" value="${currentUser.lastName}">
                </div>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" value="${currentUser.email}" disabled>
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="tel" id="profile-phone" value="${currentUser.phone || ''}">
              </div>
              <div class="form-group">
                <label>Bio</label>
                <textarea id="profile-bio">${currentUser.bio || ''}</textarea>
              </div>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function handleUpdateProfile(e) {
  e.preventDefault();

  try {
    const updated = await api.updateProfile({
      firstName: document.getElementById('profile-firstname').value,
      lastName: document.getElementById('profile-lastname').value,
      phone: document.getElementById('profile-phone').value,
      bio: document.getElementById('profile-bio').value,
    });

    currentUser = updated;
    updateNavForUser();
    showToast('Profile updated successfully!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
