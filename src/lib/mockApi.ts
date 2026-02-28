// fake ai call that waits 2 seconds then returns a fixed string
export async function mockGeminiGenerate(prompt: string, ingestContent?: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const combined = ingestContent ? `${prompt}\n\n[ingested content]\n${ingestContent}` : prompt;
  return `gemini response for: ${combined.slice(0, 50)}...`;
}
