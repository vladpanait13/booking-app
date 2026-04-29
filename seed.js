const { initDatabase, runSql, queryOne } = require('./database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function seed() {
  console.log('🌱 Seeding database...');

  // Delete existing database to start fresh
  const dbPath = path.join(__dirname, 'database.db');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  await initDatabase();

// Create users
const hashedPassword = bcrypt.hashSync('password123', 10);

const users = [
  { email: 'john@example.com', firstName: 'John', lastName: 'Smith', phone: '+1-555-0101', bio: 'Travel enthusiast and Superhost. Love meeting new people from around the world!', isHost: 1 },
  { email: 'sarah@example.com', firstName: 'Sarah', lastName: 'Johnson', phone: '+1-555-0102', bio: 'Interior designer turned host. Every space tells a story.', isHost: 1 },
  { email: 'maria@example.com', firstName: 'Maria', lastName: 'Garcia', phone: '+1-555-0103', bio: 'Beach lover and foodie. Ask me for local restaurant recommendations!', isHost: 1 },
  { email: 'david@example.com', firstName: 'David', lastName: 'Chen', phone: '+1-555-0104', bio: 'Architect by day, host by passion. My properties feature unique designs.', isHost: 1 },
  { email: 'emma@example.com', firstName: 'Emma', lastName: 'Wilson', phone: '+1-555-0105', bio: 'Nature lover. My cabins are perfect for those seeking tranquility.', isHost: 1 },
  { email: 'guest@example.com', firstName: 'Alex', lastName: 'Brown', phone: '+1-555-0106', bio: 'Always looking for the next adventure!', isHost: 0 },
];

const userIds = [];

for (const user of users) {
  const result = runSql('INSERT INTO users (email, password, firstName, lastName, phone, bio, isHost) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user.email, hashedPassword, user.firstName, user.lastName, user.phone, user.bio, user.isHost]);
  userIds.push(result.lastId);
}

// Create properties
const properties = [
  {
    hostId: userIds[0], title: 'Luxury Downtown Apartment with City Views',
    description: 'Experience city living at its finest in this stunning luxury apartment. Floor-to-ceiling windows offer breathtaking panoramic views of the skyline. The open-plan living space features designer furniture, a fully equipped gourmet kitchen, and a cozy reading nook. Located in the heart of downtown, you\'re steps away from world-class restaurants, shopping, and entertainment. The building offers a rooftop pool, fitness center, and 24-hour concierge service.',
    type: 'apartment', pricePerNight: 189, address: '123 Main St, Apt 45', city: 'New York', country: 'United States',
    latitude: 40.7128, longitude: -74.0060, maxGuests: 4, bedrooms: 2, bathrooms: 2, beds: 2,
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Air conditioning', 'Washer', 'Dryer', 'TV', 'Elevator', 'Gym', 'Pool', 'Parking']),
    images: JSON.stringify(['/images/properties/apt1-1.jpg', '/images/properties/apt1-2.jpg', '/images/properties/apt1-3.jpg']),
    thumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', rating: 4.9, reviewCount: 127
  },
  {
    hostId: userIds[1], title: 'Charming Beachfront Villa with Private Pool',
    description: 'Wake up to the sound of waves in this stunning beachfront villa. This Mediterranean-style property features a private infinity pool overlooking the ocean, spacious sun terraces, and lush tropical gardens. The interior boasts hand-crafted furniture, local artwork, and luxurious linens. The fully equipped kitchen opens to an outdoor dining area perfect for sunset dinners. Direct beach access through your private garden path.',
    type: 'villa', pricePerNight: 350, address: '45 Ocean Drive', city: 'Miami', country: 'United States',
    latitude: 25.7617, longitude: -80.1918, maxGuests: 8, bedrooms: 4, bathrooms: 3, beds: 5,
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Pool', 'Beach access', 'Air conditioning', 'BBQ', 'Parking', 'Garden', 'Ocean view', 'Outdoor shower']),
    images: JSON.stringify(['/images/properties/villa1-1.jpg', '/images/properties/villa1-2.jpg']),
    thumbnail: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop', rating: 4.8, reviewCount: 89
  },
  {
    hostId: userIds[2], title: 'Cozy Mountain Cabin Retreat',
    description: 'Escape to this enchanting mountain cabin nestled among towering pines. The rustic-chic interior features a stone fireplace, exposed wooden beams, and large windows framing mountain vistas. Curl up with a book on the wraparound porch or explore nearby hiking trails. The fully equipped kitchen and outdoor fire pit make this perfect for both summer and winter getaways. Star-gazing from the hot tub is an unforgettable experience.',
    type: 'cabin', pricePerNight: 165, address: '789 Pine Trail', city: 'Aspen', country: 'United States',
    latitude: 39.1911, longitude: -106.8175, maxGuests: 6, bedrooms: 3, bathrooms: 2, beds: 4,
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Fireplace', 'Hot tub', 'Hiking', 'Mountain view', 'Parking', 'BBQ', 'Porch', 'Board games']),
    images: JSON.stringify(['/images/properties/cabin1-1.jpg', '/images/properties/cabin1-2.jpg']),
    thumbnail: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&h=600&fit=crop', rating: 4.95, reviewCount: 203
  },
  {
    hostId: userIds[3], title: 'Modern Loft in Arts District',
    description: 'A stunning converted warehouse loft in the vibrant Arts District. This open-concept space features soaring 16-foot ceilings, original exposed brick walls, polished concrete floors, and industrial-chic design throughout. The kitchen island seats six, perfect for entertaining. Floor-to-ceiling factory windows flood the space with natural light. Walking distance to galleries, craft breweries, and the best street food in the city.',
    type: 'loft', pricePerNight: 145, address: '567 Gallery Row', city: 'Los Angeles', country: 'United States',
    latitude: 34.0407, longitude: -118.2368, maxGuests: 3, bedrooms: 1, bathrooms: 1, beds: 1,
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Air conditioning', 'Washer', 'Dryer', 'TV', 'Workspace', 'Coffee maker', 'Bike storage']),
    images: JSON.stringify(['/images/properties/loft1-1.jpg', '/images/properties/loft1-2.jpg']),
    thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', rating: 4.7, reviewCount: 156
  },
  {
    hostId: userIds[4], title: 'Romantic Tuscan Cottage with Vineyard Views',
    description: 'Step into a postcard in this authentic Tuscan stone cottage surrounded by rolling vineyards and olive groves. The lovingly restored interior combines original features with modern comforts. Enjoy breakfast on the terrace overlooking the valley, cook with fresh herbs from the garden, or simply relax by the outdoor pool. The nearby village offers charming trattorias and weekly markets. Wine tasting experiences can be arranged.',
    type: 'cottage', pricePerNight: 220, address: 'Via del Chianti 23', city: 'Florence', country: 'Italy',
    latitude: 43.7696, longitude: 11.2558, maxGuests: 4, bedrooms: 2, bathrooms: 1, beds: 2,
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Pool', 'Garden', 'Vineyard', 'Terrace', 'Parking', 'Wine cellar', 'BBQ', 'Countryside view']),
    images: JSON.stringify(['/images/properties/cottage1-1.jpg', '/images/properties/cottage1-2.jpg']),
    thumbnail: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&h=600&fit=crop', rating: 4.92, reviewCount: 178
  },
  {
    hostId: userIds[0], title: 'Sleek Studio in Tokyo\'s Shibuya District',
    description: 'Ultra-modern studio in the heart of Tokyo\'s trendiest neighborhood. Minimalist Japanese design meets cutting-edge technology with smart home features throughout. The space-efficient layout includes a comfortable sleeping area, compact kitchen, and luxurious rain shower bathroom. Step outside to find yourself surrounded by Shibuya\'s famous nightlife, shopping, and the iconic crossing. Perfect base for exploring Tokyo.',
    type: 'studio', pricePerNight: 95, address: '2-1 Shibuya', city: 'Tokyo', country: 'Japan',
    latitude: 35.6580, longitude: 139.7016, maxGuests: 2, bedrooms: 1, bathrooms: 1, beds: 1,
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Air conditioning', 'TV', 'Washer', 'Smart home', 'Metro access']),
    images: JSON.stringify(['/images/properties/studio1-1.jpg']),
    thumbnail: 'https://images.unsplash.com/photo-1536437075651-01d675529a3b?w=800&h=600&fit=crop', rating: 4.6, reviewCount: 92
  },
  {
    hostId: userIds[1], title: 'Penthouse Suite with Rooftop Terrace',
    description: 'Live like royalty in this spectacular penthouse perched atop one of Barcelona\'s most prestigious buildings. The wraparound rooftop terrace offers 360-degree views of the city, from the Sagrada Familia to the Mediterranean Sea. Interior features include marble floors, crystal chandeliers, and a curated art collection. The private chef\'s kitchen, home cinema, and spa bathroom make this an unparalleled luxury experience.',
    type: 'apartment', pricePerNight: 450, address: 'Passeig de Gràcia 78', city: 'Barcelona', country: 'Spain',
    latitude: 41.3934, longitude: 2.1635, maxGuests: 6, bedrooms: 3, bathrooms: 3, beds: 4,
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Air conditioning', 'Terrace', 'City view', 'Elevator', 'Doorman', 'Parking', 'Home cinema', 'Spa bathroom']),
    images: JSON.stringify(['/images/properties/pent1-1.jpg', '/images/properties/pent1-2.jpg']),
    thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop', rating: 4.85, reviewCount: 67
  },
  {
    hostId: userIds[2], title: 'Oceanview Beach House - Surfer\'s Paradise',
    description: 'The ultimate beach house for surf lovers and ocean enthusiasts. Wake up to panoramic ocean views from your bedroom, grab your board from the rack, and be on the waves in minutes. The open-plan living area flows onto a large deck with outdoor seating and BBQ. Indoor-outdoor shower, surfboard storage, and beach gear provided. The local break is perfect for all skill levels. Sunset views are absolutely epic.',
    type: 'house', pricePerNight: 275, address: '12 Surf Lane', city: 'Byron Bay', country: 'Australia',
    latitude: -28.6437, longitude: 153.6120, maxGuests: 8, bedrooms: 4, bathrooms: 2, beds: 5,
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Beach access', 'BBQ', 'Surfboards', 'Outdoor shower', 'Deck', 'Ocean view', 'Parking', 'Garden']),
    images: JSON.stringify(['/images/properties/beach1-1.jpg', '/images/properties/beach1-2.jpg']),
    thumbnail: 'https://images.unsplash.com/photo-1499793983394-12a2e71e0222?w=800&h=600&fit=crop', rating: 4.88, reviewCount: 145
  },
  {
    hostId: userIds[3], title: 'Historic Parisian Apartment near Eiffel Tower',
    description: 'A beautifully appointed Haussmann-era apartment in the 7th arrondissement with glimpses of the Eiffel Tower. Original parquet floors, ornate moldings, and a marble fireplace create an authentically Parisian atmosphere. The modern kitchen and bathroom have been elegantly updated. Located on a quiet tree-lined street, yet minutes from the Eiffel Tower, Musée d\'Orsay, and charming local cafés and boulangeries.',
    type: 'apartment', pricePerNight: 210, address: '34 Rue de Grenelle', city: 'Paris', country: 'France',
    latitude: 48.8566, longitude: 2.3522, maxGuests: 4, bedrooms: 2, bathrooms: 1, beds: 2,
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Heating', 'Washer', 'TV', 'Elevator', 'Eiffel Tower view', 'Wine glasses', 'Books']),
    images: JSON.stringify(['/images/properties/paris1-1.jpg', '/images/properties/paris1-2.jpg']),
    thumbnail: 'https://images.unsplash.com/photo-1549638441-b787d2e11f14?w=800&h=600&fit=crop', rating: 4.75, reviewCount: 234
  },
  {
    hostId: userIds[4], title: 'Secluded Treehouse in the Rainforest',
    description: 'An extraordinary treehouse experience elevated among the canopy of a tropical rainforest. Connected by wooden walkways and featuring open-air living spaces, this eco-luxury retreat offers a unique communion with nature. Listen to exotic birds and howler monkeys while relaxing in your hammock. The outdoor rain shower and composting toilet are surprisingly comfortable. Solar-powered with gourmet breakfast included.',
    type: 'cabin', pricePerNight: 195, address: 'Rainforest Reserve Rd', city: 'Monteverde', country: 'Costa Rica',
    latitude: 10.3157, longitude: -84.8285, maxGuests: 2, bedrooms: 1, bathrooms: 1, beds: 1,
    amenities: JSON.stringify(['WiFi', 'Breakfast included', 'Nature', 'Hammock', 'Hiking trails', 'Bird watching', 'Eco-friendly', 'Jungle view', 'Outdoor shower']),
    images: JSON.stringify(['/images/properties/tree1-1.jpg']),
    thumbnail: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop', rating: 4.97, reviewCount: 89
  },
  {
    hostId: userIds[0], title: 'Stylish Boutique Hotel Room in Santorini',
    description: 'Iconic white-washed cave suite carved into the caldera cliffs of Santorini. The private terrace with plunge pool offers front-row seats to the world\'s most famous sunset. The interior features traditional Cycladic architecture with modern luxury touches — king bed, rainfall shower, and premium amenities. Daily breakfast served on your terrace. Walking distance to Oia\'s blue-domed churches and artisan shops.',
    type: 'hotel', pricePerNight: 380, address: 'Caldera Cliffs', city: 'Santorini', country: 'Greece',
    latitude: 36.4618, longitude: 25.3753, maxGuests: 2, bedrooms: 1, bathrooms: 1, beds: 1,
    amenities: JSON.stringify(['WiFi', 'Breakfast included', 'Plunge pool', 'Terrace', 'Sunset view', 'Air conditioning', 'Mini bar', 'Room service', 'Caldera view']),
    images: JSON.stringify(['/images/properties/santo1-1.jpg']),
    thumbnail: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop', rating: 4.93, reviewCount: 312
  },
  {
    hostId: userIds[1], title: 'Spacious Family Home with Garden',
    description: 'A warm and welcoming family home in a quiet residential neighborhood, perfect for families or groups wanting a home-away-from-home experience. The large backyard features a trampoline, swing set, and covered patio with BBQ. Inside you\'ll find a well-stocked kitchen, cozy living room with fireplace, game room, and comfortable bedrooms. Close to parks, museums, and family-friendly restaurants. Pack-n-play and highchair available.',
    type: 'house', pricePerNight: 185, address: '456 Maple Avenue', city: 'London', country: 'United Kingdom',
    latitude: 51.5074, longitude: -0.1278, maxGuests: 8, bedrooms: 4, bathrooms: 3, beds: 6,
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Garden', 'Washer', 'Dryer', 'TV', 'Fireplace', 'BBQ', 'Parking', 'Kid-friendly', 'High chair', 'Game room']),
    images: JSON.stringify(['/images/properties/house1-1.jpg', '/images/properties/house1-2.jpg']),
    thumbnail: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', rating: 4.82, reviewCount: 98
  }
];

const propertyIds = [];
for (const p of properties) {
  const result = runSql(`
    INSERT INTO properties (hostId, title, description, type, pricePerNight, address, city, country, latitude, longitude, maxGuests, bedrooms, bathrooms, beds, amenities, images, thumbnail, rating, reviewCount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [p.hostId, p.title, p.description, p.type, p.pricePerNight, p.address, p.city, p.country, p.latitude, p.longitude, p.maxGuests, p.bedrooms, p.bathrooms, p.beds, p.amenities, p.images, p.thumbnail, p.rating, p.reviewCount]);
  propertyIds.push(result.lastId);
}

// Create some bookings
const bookings = [
  { propertyId: propertyIds[0], guestId: userIds[5], hostId: userIds[0], checkIn: '2026-05-10', checkOut: '2026-05-15', guests: 2, totalPrice: 1060.80, serviceFee: 113.40, status: 'confirmed' },
  { propertyId: propertyIds[2], guestId: userIds[5], hostId: userIds[2], checkIn: '2026-04-01', checkOut: '2026-04-05', guests: 4, totalPrice: 739.20, serviceFee: 79.20, status: 'completed' },
  { propertyId: propertyIds[4], guestId: userIds[5], hostId: userIds[4], checkIn: '2026-06-20', checkOut: '2026-06-27', guests: 2, totalPrice: 1724.80, serviceFee: 184.80, status: 'pending' },
  { propertyId: propertyIds[1], guestId: userIds[5], hostId: userIds[1], checkIn: '2026-03-15', checkOut: '2026-03-20', guests: 6, totalPrice: 1960.00, serviceFee: 210.00, status: 'completed' },
];

const bookingIds = [];
for (const b of bookings) {
  const result = runSql('INSERT INTO bookings (propertyId, guestId, hostId, checkIn, checkOut, guests, totalPrice, serviceFee, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [b.propertyId, b.guestId, b.hostId, b.checkIn, b.checkOut, b.guests, b.totalPrice, b.serviceFee, b.status]);
  bookingIds.push(result.lastId);
}

// Create reviews for completed bookings
const reviews = [
  { propertyId: propertyIds[2], guestId: userIds[5], bookingId: bookingIds[1], rating: 5, comment: 'Absolutely magical cabin! The views were breathtaking and the hot tub under the stars was an unforgettable experience. John was an incredible host, very responsive and thoughtful with his recommendations. Would definitely come back!', cleanlinessRating: 5, communicationRating: 5, locationRating: 5, valueRating: 5 },
  { propertyId: propertyIds[1], guestId: userIds[5], bookingId: bookingIds[3], rating: 5, comment: 'The villa exceeded all expectations. Waking up to ocean views every morning was a dream. The private pool and beach access made us feel like we were on a private island. Sarah is a wonderful host!', cleanlinessRating: 5, communicationRating: 5, locationRating: 5, valueRating: 4 },
];

for (const r of reviews) {
  runSql('INSERT INTO reviews (propertyId, guestId, bookingId, rating, comment, cleanlinessRating, communicationRating, locationRating, valueRating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [r.propertyId, r.guestId, r.bookingId, r.rating, r.comment, r.cleanlinessRating, r.communicationRating, r.locationRating, r.valueRating]);
}

// Add some favorites
try { runSql('INSERT INTO favorites (userId, propertyId) VALUES (?, ?)', [userIds[5], propertyIds[0]]); } catch(e) {}
try { runSql('INSERT INTO favorites (userId, propertyId) VALUES (?, ?)', [userIds[5], propertyIds[4]]); } catch(e) {}
try { runSql('INSERT INTO favorites (userId, propertyId) VALUES (?, ?)', [userIds[5], propertyIds[10]]); } catch(e) {}

console.log('✅ Database seeded successfully!');
console.log(`   - ${users.length} users created`);
console.log(`   - ${properties.length} properties created`);
console.log(`   - ${bookings.length} bookings created`);
console.log(`   - ${reviews.length} reviews created`);
console.log('');
console.log('📧 Demo accounts:');
console.log('   Host: john@example.com / password123');
console.log('   Host: sarah@example.com / password123');
console.log('   Guest: guest@example.com / password123');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
