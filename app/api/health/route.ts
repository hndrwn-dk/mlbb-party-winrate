import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check if DATABASE_URL is configured
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    
    if (!hasDatabaseUrl) {
      return NextResponse.json(
        {
          status: "error",
          message: "DATABASE_URL not configured",
          checks: {
            databaseUrl: false,
            databaseConnection: false,
          },
        },
        { status: 500 }
      );
    }

    // Test database connection
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if tables exist
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `;

    const hasUserTable = tables.some((t) => t.tablename === "User");
    const hasFriendTable = tables.some((t) => t.tablename === "Friend");

    await prisma.$disconnect();

    return NextResponse.json({
      status: "ok",
      message: "Database connection successful",
      checks: {
        databaseUrl: true,
        databaseConnection: true,
        migrationsApplied: hasUserTable && hasFriendTable,
        tablesFound: tables.map((t) => t.tablename),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      {
        status: "error",
        message: errorMessage,
        checks: {
          databaseUrl: !!process.env.DATABASE_URL,
          databaseConnection: false,
        },
      },
      { status: 500 }
    );
  }
}
