import { prisma } from "./prisma";

export async function requireUserId(): Promise<string> {
  try {
    // Stub local session - in production, replace with NextAuth
    const user = await prisma.user.findFirst();
    if (!user) {
      const newUser = await prisma.user.create({
        data: {},
      });
      return newUser.id;
    }
    return user.id;
  } catch (error) {
    console.error("requireUserId error:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to get user ID: ${error.message}`);
    }
    throw new Error("Failed to get user ID: Unknown error");
  }
}

export async function getUserId(): Promise<string | null> {
  try {
    return await requireUserId();
  } catch {
    return null;
  }
}
