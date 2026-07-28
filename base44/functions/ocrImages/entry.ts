import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { formatPages } from '../../shared/formatOutput.ts';

const OCR_PROMPT = `You are a world-class manga / manhwa / webtoon OCR specialist. You transcribe comic panels with near-perfect accuracy and classify every piece of text by its bubble / element type.

INPUT: one comic panel image.
GOAL: transcribe ALL visible text in correct reading order and tag each item with the right type.

READING ORDER:
- Japanese manga: panels top-to-bottom, right-to-left; within a panel top-to-bottom, right-to-left.
- Korean manhwa / webtoons: top-to-bottom, left-to-right.
- If unclear, follow the natural visual flow of the speech bubbles.

CLASSIFICATION — assign each text item EXACTLY one type, using these visual cues:
- speech: normal spoken dialogue inside an oval / rounded speech bubble (usually with a tail pointing to the speaker).
- continue: a bubble whose dialogue is a DIRECT continuation of the PREVIOUS bubble's sentence (the sentence is split mid-way across bubbles). Use ONLY when it clearly continues the prior line; otherwise use "speech".
- box: text inside a rectangular caption box (narration, location, time, author notes) — sharp corners, no speech tail.
- thought: internal monologue inside a cloud-shaped or wavy/rounded bubble (no pointed tail, or a tail of small circles).
- screen: text rendered on a device or sign — phone, tablet, monitor, TV, signboard, book page, letter. Looks printed/typed, not hand-drawn speech.
- sfx: sound effects / onomatopoeia — large stylized impact, whoosh, crash, drip text, usually outside bubbles and decorative.
- shout: text inside a jagged, spiky, starburst / explosive bubble — indicates yelling or a loud exclamation.
- system: in-world system / game UI messages — "Level up", "[Quest accepted]", status windows, notifications, game/system text boxes.
- smalltext: tiny side text, furigana, margin annotations, or small notes attached to another element.
- outertext: chapter titles, narration floating outside any frame/bubble, large title text, or any text not inside a bubble or box.
- tlnote: an existing translator's / scanlator's note printed in the image, usually prefixed "TL/N:" or "Note:".

RULES:
- ONE speech bubble = ONE item. If a bubble contains several visual lines, JOIN them into a single line separated by a single space.
- Transcribe the ORIGINAL language exactly. Do NOT translate. Do NOT add quotation marks, speaker names, or any text not in the image.
- If a bubble is empty or only contains drawings, skip it.
- If text is partially cut or hard to read, give your best-guess transcription.
- Before finalizing, re-check each item's type against the visual cues above.
Return ONLY JSON matching the schema.`;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { image_urls, format, title, markers, empty_line } = body || {};
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
        model: 'gpt_5_4',
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

    const fullOutput = formatPages(pages, fmt, title, markers, empty_line);
    return Response.json({ pages, fullOutput, format: fmt, image_count: image_urls.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}