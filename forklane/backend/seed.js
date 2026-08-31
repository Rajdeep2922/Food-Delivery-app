require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('./models/Product');
const User = require('./models/User');

const seedProducts = [
  {
    name: 'Classic Chicken Burger',
    description: 'Juicy grilled chicken patty with lettuce, tomato, and our signature ForkLane sauce in a toasted brioche bun.',
    price: 249,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
    isAvailable: true,
  },
  {
    name: 'Margherita Pizza',
    description: 'Stone-baked pizza with fresh mozzarella, San Marzano tomato sauce, and basil leaves. Classic and perfect.',
    price: 349,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80',
    isAvailable: true,
  },
  {
    name: 'Paneer Tikka',
    description: 'Succulent cottage cheese cubes marinated in spiced yogurt, chargrilled to perfection. Served with mint chutney.',
    price: 299,
    category: 'Indian',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&q=80',
    isAvailable: true,
  },
  {
    name: 'Chicken Biryani',
    description: 'Fragrant basmati rice slow-cooked with tender chicken, whole spices, and caramelized onions. Served with raita.',
    price: 379,
    category: 'Indian',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80',
    isAvailable: true,
  },
  {
    name: 'Creamy Alfredo Pasta',
    description: 'Fettuccine tossed in a rich Parmesan cream sauce with garlic and black pepper. Simple, indulgent perfection.',
    price: 329,
    category: 'Pasta',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&q=80',
    isAvailable: true,
  },
  {
    name: 'Chocolate Brownie',
    description: 'Dense, fudgy chocolate brownie with a crinkle top. Served warm with a dusting of powdered sugar.',
    price: 149,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1607131049201-f1d7b0a48f0f?w=500&q=80',
    isAvailable: true,
  },
  {
    name: 'Cold Coffee',
    description: 'Blended espresso with chilled milk, a hint of vanilla, and crushed ice. The perfect pick-me-up.',
    price: 129,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80',
    isAvailable: true,
  },
  {
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce, shaved Parmesan, house-made croutons, and classic Caesar dressing. Light and satisfying.',
    price: 249,
    category: 'Healthy',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80',
    isAvailable: true,
  },
  {
    name: 'Kung Pao Chicken',
    description: 'Wok-fried chicken with roasted peanuts, dried chilies, and a spicy-sweet sauce. A Chinese takeout classic.',
    price: 339,
    category: 'Chinese',
    image: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=500&q=80',
    isAvailable: true,
  },
  {
    name: 'Pepperoni Pizza',
    description: 'Crispy thin crust loaded with zesty pepperoni, mozzarella, and tomato sauce. A crowd-pleaser every time.',
    price: 399,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&q=80',
    isAvailable: true,
  },
  {
    name: 'Veggie Burger',
    description: 'House-made black bean patty with avocado, pickled jalapeños, and chipotle mayo. Hearty and satisfying.',
    price: 219,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80',
    isAvailable: true,
  },
  {
    name: 'Mango Lassi',
    description: 'Chilled, velvety blend of Alphonso mango, yogurt, and a touch of cardamom. Utterly refreshing.',
    price: 99,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1626201850067-4c7f6e45e0cc?w=500&q=80',
    isAvailable: true,
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Create a system admin to use as createdBy reference
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'ForkLane Admin',
        email: process.env.SEED_ADMIN_EMAIL || 'admin@forklane.com',
        password: process.env.SEED_ADMIN_PASSWORD || 'admin123456',
        role: 'admin',
      });
      console.log(`👤 Admin created: ${adminUser.email}`);
    }

    // Seed products
    const products = seedProducts.map((p) => ({ ...p, createdBy: adminUser._id }));
    await Product.insertMany(products);
    console.log(`🌱 Seeded ${products.length} products`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Credentials:');
    console.log(`   Admin Email: ${adminUser.email}`);
    if (process.env.SEED_ADMIN_PASSWORD) {
      console.log(`   Admin Password: ${process.env.SEED_ADMIN_PASSWORD}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedDB();
