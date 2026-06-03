import { NextRequest, NextResponse } from "next/server";
import { fetchPhotos } from "@/lib/pexels";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "all";
  const page = parseInt(searchParams.get("page") ?? "1");
  const photos = await fetchPhotos(category, page);
  return NextResponse.json(photos);
}
