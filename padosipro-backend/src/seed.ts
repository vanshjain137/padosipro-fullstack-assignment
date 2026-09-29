import prisma from './db.js';

export const seedTasks = async () => {
  const count = await prisma.task.count();
  if (count > 0) {
    console.log('Task catalogue is already seeded.');
    return;
  }

  console.log('Seeding task catalogue...');

  const tasks = [
    // Category 1: Home Maintenance
    { category: 'Home Maintenance', name: 'Plumbing Repair', description: 'Fix leaks, unclog drains, and repair pipes.' },
    { category: 'Home Maintenance', name: 'Electrical Work', description: 'Install fixtures, fix wiring, and replace outlets.' },
    { category: 'Home Maintenance', name: 'AC Servicing', description: 'Deep cleaning and maintenance of air conditioners.' },
    { category: 'Home Maintenance', name: 'Carpentry', description: 'Furniture repair, custom shelving, and door fixing.' },
    { category: 'Home Maintenance', name: 'Pest Control', description: 'Comprehensive extermination of insects and rodents.' },

    // Category 2: Cleaning
    { category: 'Cleaning', name: 'Deep Home Cleaning', description: 'Intensive floor-to-ceiling cleaning of the entire house.' },
    { category: 'Cleaning', name: 'Sofa Cleaning', description: 'Professional shampooing and vacuuming of sofas.' },
    { category: 'Cleaning', name: 'Bathroom Cleaning', description: 'Deep cleaning and sanitization of washrooms.' },
    { category: 'Cleaning', name: 'Kitchen Cleaning', description: 'Degreasing appliances, cabinets, and countertops.' },
    { category: 'Cleaning', name: 'Carpet Cleaning', description: 'Stain removal and deep washing of rugs and carpets.' },

    // Category 3: Errands & Delivery
    { category: 'Errands & Delivery', name: 'Grocery Shopping', description: 'Purchase and delivery of weekly household groceries.' },
    { category: 'Errands & Delivery', name: 'Medicine Delivery', description: 'Pick up and drop off prescribed medicines.' },
    { category: 'Errands & Delivery', name: 'Document Courier', description: 'Secure delivery of important documents within the city.' },
    { category: 'Errands & Delivery', name: 'Laundry Pickup', description: 'Collection and return of clothes for dry cleaning.' },
    { category: 'Errands & Delivery', name: 'Gift Delivery', description: 'Purchase and deliver gifts for special occasions.' },

    // Category 4: Lifestyle & Planning
    { category: 'Lifestyle & Planning', name: 'Event Planning', description: 'Organize birthdays, anniversaries, or small gatherings.' },
    { category: 'Lifestyle & Planning', name: 'Travel Booking', description: 'Research and book flights, hotels, and itineraries.' },
    { category: 'Lifestyle & Planning', name: 'Personal Shopper', description: 'Assistance with buying clothes or electronics.' },
    { category: 'Lifestyle & Planning', name: 'Fitness Trainer', description: 'Book a personal yoga or gym trainer at home.' },
    { category: 'Lifestyle & Planning', name: 'Chef on Demand', description: 'Hire a professional cook for a special meal at home.' },
  ];

  await prisma.task.createMany({
    data: tasks,
  });

  console.log('Seeded 20 tasks successfully!');
};