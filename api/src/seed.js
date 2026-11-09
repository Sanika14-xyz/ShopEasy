const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  {
    name: 'Everyday Backpack',
    description: 'A lightweight backpack with room for all your daily essentials.',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    category: 'Accessories'
  },
  {
    name: 'Classic Sneakers',
    description: 'Comfortable, versatile sneakers for everyday adventures.',
    price: 64.5,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    category: 'Footwear'
  },
  {
    name: 'Insulated Travel Mug',
    description: 'A reusable stainless-steel mug that keeps drinks at the right temperature.',
    price: 18.75,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80',
    category: 'Home'
  },
  {
    name: 'Morning Pour-Over Set',
    description: 'A simple ceramic pour-over set for slower, better mornings.',
    price: 32.0,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    category: 'Home'
  },
  {
    name: 'Market Day Tote',
    description: 'A roomy everyday tote for errands, books, and little adventures.',
    price: 26.0,
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
    category: 'Accessories'
  },
  {
    name: 'Soft Knit Throw',
    description: 'A cozy textured throw to make your favorite corner feel even better.',
    price: 48.0,
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
    category: 'Home'
  },
  {
    name: 'Pocket Sketchbook',
    description: 'A handy notebook for lists, ideas, doodles, and everything in between.',
    price: 14.0,
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=800&q=80',
    category: 'Stationery'
  },
  {
    name: 'Weekend Sunglasses',
    description: 'An easy, classic frame for bright days and getting out the door.',
    price: 29.5,
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
    category: 'Accessories'
  },
  {
    name: 'Slow Evening Candle',
    description: 'A warm, gentle candle to help make home feel a little cozier.',
    price: 21.0,
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
    category: 'Home'
  },
  {
    name: 'Stoneware Breakfast Bowl',
    description: 'A versatile handmade-look bowl for breakfast, snacks, and cozy dinners.',
    price: 16.0,
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
    category: 'Kitchen'
  },
  {
    name: 'Linen Table Runner',
    description: 'An easy layer of natural texture for everyday meals and gatherings.',
    price: 34.0,
    image: 'https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=800&q=80',
    category: 'Kitchen'
  },
  {
    name: 'Wooden Serving Board',
    description: 'A sturdy acacia board for serving snacks or prepping ingredients.',
    price: 28.0,
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    category: 'Kitchen'
  },
  {
    name: 'Glass Water Carafe',
    description: 'A clean-lined glass carafe that makes staying hydrated feel special.',
    price: 24.0,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    category: 'Kitchen'
  },
  {
    name: 'Cotton Tea Towel Set',
    description: 'A pair of absorbent cotton towels for the busiest corner of your kitchen.',
    price: 19.0,
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    category: 'Kitchen'
  },
  {
    name: 'Espresso Cup Pair',
    description: 'Two petite ceramic cups for a quiet coffee break at home.',
    price: 22.0,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    category: 'Kitchen'
  },
  {
    name: 'Reusable Lunch Box',
    description: 'A compact, reusable lunch box for workdays, picnics, and leftovers.',
    price: 27.0,
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    category: 'Kitchen'
  },
  {
    name: 'Herb Garden Planter',
    description: 'A small windowsill planter for fresh herbs within easy reach.',
    price: 23.0,
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80',
    category: 'Home'
  },
  {
    name: 'Woven Storage Basket',
    description: 'A natural woven basket for tidying blankets, books, or everyday bits.',
    price: 36.0,
    image: 'https://images.unsplash.com/photo-1593085260707-5377ba37f868?auto=format&fit=crop&w=800&q=80',
    category: 'Home'
  },
  {
    name: 'Soft Cotton Cushion',
    description: 'A comfortable cotton cushion cover in a calm, easy-to-style color.',
    price: 31.0,
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
    category: 'Home'
  },
  {
    name: 'Ceramic Bud Vase',
    description: 'A little sculptural vase for a single stem or a fresh-picked flower.',
    price: 17.0,
    image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=800&q=80',
    category: 'Home'
  },
  {
    name: 'Desk Catchall Tray',
    description: 'A handy catchall for keys, jewelry, and small things that need a home.',
    price: 20.0,
    image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=800&q=80',
    category: 'Home'
  },
  {
    name: 'Amber Glass Soap Bottle',
    description: 'A refillable amber glass bottle to keep by the kitchen or bathroom sink.',
    price: 15.0,
    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=80',
    category: 'Home'
  },
  {
    name: 'Natural Fiber Doormat',
    description: 'A durable woven welcome mat for a warm first impression at the door.',
    price: 39.0,
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
    category: 'Home'
  },
  {
    name: 'Minimal Wall Clock',
    description: 'A simple, quiet wall clock with a clean face that suits any room.',
    price: 42.0,
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80',
    category: 'Home'
  },
  {
    name: 'Rechargeable Reading Light',
    description: 'A portable warm light for late-night reading and calm corners.',
    price: 33.0,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    category: 'Home'
  },
  {
    name: 'Foldable Market Basket',
    description: 'A lightweight foldable basket that is ready for market mornings.',
    price: 25.0,
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
    category: 'Accessories'
  },
  {
    name: 'Everyday Canvas Cap',
    description: 'A relaxed cotton cap for sunny walks and casual weekends.',
    price: 22.0,
    image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=800&q=80',
    category: 'Accessories'
  },
  {
    name: 'Slim Card Wallet',
    description: 'A compact wallet that keeps your essential cards close at hand.',
    price: 30.0,
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    category: 'Accessories'
  },
  {
    name: 'Weekend Duffle Bag',
    description: 'A roomy soft-sided bag for overnight plans and short getaways.',
    price: 58.0,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    category: 'Accessories'
  },
  {
    name: 'Everyday Leather Belt',
    description: 'A classic adjustable belt with a simple finish for everyday wear.',
    price: 35.0,
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
    category: 'Accessories'
  },
  {
    name: 'Soft Wool Beanie',
    description: 'A warm rib-knit beanie for crisp mornings and chilly walks.',
    price: 28.0,
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80',
    category: 'Accessories'
  },
  {
    name: 'Classic Leather Watch',
    description: 'An understated everyday watch with a comfortable leather strap.',
    price: 72.0,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    category: 'Accessories'
  },
  {
    name: 'Lightweight Travel Scarf',
    description: 'A soft, easy-to-pack scarf for changing weather and long journeys.',
    price: 32.0,
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80',
    category: 'Accessories'
  },
  {
    name: 'Everyday Crossbody Pouch',
    description: 'A small hands-free bag for your phone, keys, and daily essentials.',
    price: 37.0,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    category: 'Accessories'
  },
  {
    name: 'Colorblock Crew Socks',
    description: 'A soft cotton crew sock with a cheerful little pop of color.',
    price: 12.0,
    image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=800&q=80',
    category: 'Accessories'
  },
  {
    name: 'Daily Notes Journal',
    description: 'A lay-flat notebook for plans, reflections, and passing ideas.',
    price: 18.0,
    image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80',
    category: 'Stationery'
  },
  {
    name: 'Fine Tip Pen Set',
    description: 'A set of smooth-writing pens for lists, notes, and sketches.',
    price: 11.0,
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
    category: 'Stationery'
  },
  {
    name: 'Weekly Desk Planner',
    description: 'A simple undated planner pad to make the week feel more manageable.',
    price: 16.0,
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80',
    category: 'Stationery'
  },
  {
    name: 'Set of Art Postcards',
    description: 'A small set of illustrated postcards for notes and happy mail.',
    price: 9.0,
    image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80',
    category: 'Stationery'
  },
  {
    name: 'Recycled Paper Gift Wrap',
    description: 'A roll of recycled gift wrap for thoughtful presents, big and small.',
    price: 13.0,
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
    category: 'Stationery'
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'A durable insulated bottle to take along on busy days.',
    price: 29.0,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    category: 'Outdoor'
  },
  {
    name: 'Packable Picnic Blanket',
    description: 'A soft, foldable blanket for park afternoons and weekend picnics.',
    price: 44.0,
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
    category: 'Outdoor'
  },
  {
    name: 'Compact Travel Umbrella',
    description: 'A lightweight umbrella that tucks neatly into a bag for rainy days.',
    price: 27.0,
    image: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=800&q=80',
    category: 'Outdoor'
  },
  {
    name: 'Canvas Garden Apron',
    description: 'A sturdy pocketed apron for potting plants and weekend projects.',
    price: 31.0,
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80',
    category: 'Outdoor'
  },
  {
    name: 'Pocket Binoculars',
    description: 'Compact binoculars for birdwatching, hikes, and curious day trips.',
    price: 49.0,
    image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=80',
    category: 'Outdoor'
  },
  {
    name: 'Gentle Hand Cream',
    description: 'A quick-absorbing hand cream for a little care throughout the day.',
    price: 14.0,
    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=80',
    category: 'Personal Care'
  },
  {
    name: 'Daily Face Cleanser',
    description: 'A gentle everyday cleanser for a fresh, simple start and finish.',
    price: 19.0,
    image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=80',
    category: 'Personal Care'
  },
  {
    name: 'Botanical Bath Soak',
    description: 'A fragrant mineral bath soak for a quiet moment at the end of the day.',
    price: 17.0,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
    category: 'Personal Care'
  },
  {
    name: 'Wooden Hair Brush',
    description: 'A comfortable wooden brush for an easy everyday grooming routine.',
    price: 24.0,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    category: 'Personal Care'
  },
  {
    name: 'Reusable Cotton Face Pads',
    description: 'A washable set of soft cotton pads for a reusable daily routine.',
    price: 15.0,
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80',
    category: 'Personal Care'
  },
  {
    name: 'Everyday Leather Sandals',
    description: 'Easy slip-on sandals for warm days, slow mornings, and weekend plans.',
    price: 46.0,
    image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=800&q=80',
    category: 'Footwear'
  },
  {
    name: 'Canvas Slip-On Shoes',
    description: 'Lightweight canvas shoes that are easy to wear and easy to pair.',
    price: 42.0,
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
    category: 'Footwear'
  },
  {
    name: 'Cozy House Slippers',
    description: 'Soft, comfortable slippers for relaxing at home after a long day.',
    price: 33.0,
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
    category: 'Footwear'
  },
  {
    name: 'Classic Everyday Trainers',
    description: 'A versatile pair of trainers for errands, walks, and daily routines.',
    price: 68.0,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    category: 'Footwear'
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopeasy');
  await Product.bulkWrite(products.map((product) => ({
    updateOne: {
      filter: { name: product.name },
      update: { $set: product },
      upsert: true
    }
  })));
  const count = await Product.countDocuments();
  console.log(`Seeded ${products.length} ShopEasy products; catalog now contains ${count}.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Failed to seed ShopEasy products:', error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
