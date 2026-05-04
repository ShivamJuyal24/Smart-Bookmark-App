import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { title, url, id } = await req.json();

  if (!title || !url) {
    return NextResponse.json({ tags: [] });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[autotag] Missing GROQ_API_KEY");
    return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are a bookmark tagging assistant. Given a bookmark title and URL, return 1 to 3 short lowercase tags.
Return ONLY a raw JSON array like: ["design","tools","productivity"]
No explanation. No markdown. No backticks. Just the array.`,
          },
          {
            role: "user",
            content: `Title: ${title}\nURL: ${url}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 60,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    console.log("[autotag] content:", content);

    if (!content) return NextResponse.json({ tags: [] });

    const cleaned = content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const tags = JSON.parse(cleaned);

    if (!Array.isArray(tags)) return NextResponse.json({ tags: [] });

    const safeTags = tags
      .slice(0, 1)
      .map((t: string) => String(t).toLowerCase().trim())
      .filter((t: string) => t.length > 0);

    console.log("[autotag] final tags:", safeTags);

    // If bookmark id is passed, update Supabase directly from server
    // using service role key to bypass any RLS issues
    if (id && safeTags.length > 0) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { error } = await supabase
        .from("bookmarks")
        .update({ tags: safeTags })
        .eq("id", id);

      if (error) {
        console.error("[autotag] Supabase update error:", error.message);
      } else {
        console.log("[autotag] Supabase updated successfully for id:", id);
      }
    }

    return NextResponse.json({ tags: safeTags });
  } catch (err) {
    console.error("[autotag] Error:", err);
    return NextResponse.json({ tags: [] });
  }
}