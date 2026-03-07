import { NextResponse } from "next/server";

// calls gemini 2.5 flash, returns generated text
export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "missing api key" }, { status: 500 });
  }

  let body: { prompt?: string; ingestContent?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  const ingest = typeof body.ingestContent === "string" ? body.ingestContent : "";
  const text = ingest ? `${prompt}\n\n[ingested]\n${ingest}` : prompt;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err || "gemini error" }, { status: res.status });
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const out = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return NextResponse.json({ text: out });
}
