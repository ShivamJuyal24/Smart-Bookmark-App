import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        // Pretend to be a browser so sites don't block us
        "User-Agent":
          "Mozilla/5.0 (compatible; SmartBookmarks/1.0)",
      },
      // Don't follow infinite redirects
      redirect: "follow",
    });

    const html = await response.text();

    // Extract <title> tag content
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = match ? match[1].trim() : "";

    return NextResponse.json({ title });
  } catch {
    // If fetch fails (CORS, network, etc.) just return empty — not a hard error
    return NextResponse.json({ title: "" });
  }
}