// calls our api route which uses gemini 2.5 flash
export async function geminiGenerate(prompt: string, ingestContent?: string): Promise<string> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, ingestContent }),
  });
  const data = (await res.json()) as { text?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "request failed");
  return data.text ?? "";
}
