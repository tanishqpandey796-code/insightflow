import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const report = db.reports.getByToken(params.token);
    if (!report) {
      return NextResponse.json({ error: "Report snapshot not found" }, { status: 404 });
    }
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: "Failed to retrieve report" }, { status: 500 });
  }
}
