import { prisma } from "./prisma";

export async function requireUserId(): Promise<string> {
  // Stub local session - in production, replace with NextAuth
  const user = await prisma.user.findFirst();
  if (!user) {
    const newUser = await prisma.user.create({
      data: {},
    });
    return newUser.id;
  }
  return user.id;
}

export async function getUserId(): Promise<string | null> {
  try {
    return await requireUserId();
  } catch {
    return null;
  }
}
