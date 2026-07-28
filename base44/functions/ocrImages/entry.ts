import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { formatPages } from "../../shared/formatOutput.ts";

const OCR_PROMPT = `You are an expert manga / manhwa / webtoon OCR reader.
You are given a single comic panel image. Read ALL the text visible in the image.

Rules:
- Return text in correct reading order. For Japanese manga: top-to-bottom, right-to-left. For Korean manhwa / webtoons: top-to-bottom, left-to-right.
- Each SPEECH BUBBLE is ONE item: if a single bubble contains multiple visual lines, JOIN them into one line separated by a single space.
- Classify every text item as exactly one of:
  "bubble"   = spoken dialogue INSIDE a speech bubble.
  "narration"= caption / narration / thought box / chapter title text that is OUTSIDE a speech bubble.
  "sfx"      = sound effects or onomatopoeia (stylized impact/whoosh/etc. text).
- Preserve the ORIGINAL language exactly as written. Do NOT translate. Do NOT add quotes. Do NOT add speaker names.
- If text is unreadable, still include your best guess.
Return only JSON matching the schema.`;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { image_urls, format, title } = body || {};
    if (!Array.isArray(image_urls) || image_urls.length === 0) {
      return Response.json({ error: 'No images provided' }, { status: 400 });
    }
    const fmt = format === 'md' ? 'md' : 'txt';

    const pages = [];
    for (let i = 0; i < image_urls.length; i++) {
      const url = image_urls[i];
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: OCR_PROMPT,
        file_urls: [url],
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  type: { type: "string", enum: ["bubble", "narration", "sfx"] }
                },
                required: ["text", "type"]
              }
            }
          },
          required: ["items"]
        }
      });
      const items = (res && Array.isArray(res.items)) ? res.items : [];
      pages.push({ items });
    }

    const fullOutput = formatPages(pages, fmt, title);
    return Response.json({ pages, fullOutput, format: fmt, image_count: image_urls.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}