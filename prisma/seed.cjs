const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding admin user...");

  const existing = await prisma.adminUser.findUnique({
    where: { email: "admin@example.com" },
  });

  if (existing) {
    console.log("Admin user already exists. Skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.adminUser.create({
    data: { email: "admin@example.com", name: "Admin", passwordHash },
  });

  console.log("Admin created. Login: admin@example.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
