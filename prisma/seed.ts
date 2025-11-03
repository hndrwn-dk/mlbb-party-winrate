import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const user = await prisma.user.upsert({
    where: { id: "test-user-id" },
    update: {},
    create: {
      id: "test-user-id",
      email: "test@example.com",
    },
  });

  const friend1 = await prisma.friend.upsert({
    where: {
      userId_gameUserId: {
        userId: user.id,
        gameUserId: "player123",
      },
    },
    update: {},
    create: {
      userId: user.id,
      gameUserId: "player123",
      displayName: "Test Friend 1",
    },
  });

  await prisma.friendStats.upsert({
    where: { friendId: friend1.id },
    update: {},
    create: {
      friendId: friend1.id,
      gamesTogether: 10,
      winsTogether: 7,
      avgK: 5.2,
      avgD: 3.1,
      avgA: 8.5,
      synergyScore: 0.7,
      confidence: 0.65,
    },
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
