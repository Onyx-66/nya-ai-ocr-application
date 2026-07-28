import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { formatPages } from '../../shared/formatOutput.ts';

const OCR_PROMPT = `You are an expert manga / manhwa / webtoon OCR reader.
You are given comic panel image(s). Read ALL the text visible in each image.

Reading order:
- Japanese manga: top-to-bottom, right-to-left.
- Korean manhwa / webtoons: top-to-bottom, left-to-right.

Classify every text item as exactly ONE of these types:
- speech: normal spoken dialogue INSIDE a speech bubble.
- continue: dialogue that clearly CONTINUES the previous bubble's sentence/speech (the bubble is a continuation, not a new line).
- box: caption / narration text inside a BOX or rectangular frame.
- thought: internal thoughts (usually a rounded/cloud bubble with a tail to the character).
- screen: text shown ON a screen (phone, tablet, computer, sign, TV) — not spoken.
- sfx: sound effects / onomatopoeia (stylized impact / whoosh / crash text).
- shout: text inside a SHOUT / jagged / spiky bubble (yelling).
- system: in-universe SYSTEM / game / status / notification messages.
- smalltext: small side text, annotations, or margin notes.
- outertext: narration, chapter titles, or any text OUTSIDE a bubble.
- tlnote: an existing translator's note already printed in the image (e.g. "TL/N: ...").

Rules:
- One speech bubble = ONE item. If a single bubble contains multiple visual lines, JOIN them into one line separated by a single space.
- Preserve the ORIGINAL language exactly as written. Do NOT translate. Do NOT add quotes or speaker names yourself.
- If text is unreadable, still include your best guess.
Return only JSON matching the schema.`;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { image_urls, format, title, markers } = body || {};
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
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  type: { type: 'string', enum: ['speech', 'continue', 'box', 'thought', 'screen', 'sfx', 'shout', 'system', 'smalltext', 'outertext', 'tlnote'] }
                },
                required: ['text', 'type']
              }
            }
          },
          required: ['items']
        }
      });
      const items = (res && Array.isArray(res.items)) ? res.items : [];
      pages.push({ items });
    }

    const fullOutput = formatPages(pages, fmt, title, markers);
    return Response.json({ pages, fullOutput, format: fmt, image_count: image_urls.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}