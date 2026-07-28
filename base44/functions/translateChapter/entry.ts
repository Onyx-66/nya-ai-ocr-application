import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { text, target_language } = body || {};
    if (!text || !String(text).trim()) {
      return Response.json({ error: 'No text provided' }, { status: 400 });
    }
    if (!target_language) {
      return Response.json({ error: 'A target language is required' }, { status: 400 });
    }

    const prompt = `You are an elite manga / manhwa / webtoon translator. Translate the following OCR transcript from its original language into ${target_language} with natural, fluent, in-character dialogue.

PRESERVE THE STRUCTURE EXACTLY:
- Keep every line in the same order, one bubble per line.
- Keep ALL sign markers EXACTLY as they appear at the start and/or end of each line — including ""  //  []  ()  **  SFX:  ::  <>  ST:  OT:  TL/N: and any custom signs. Move them with the line; do not remove, reorder, split, or alter them.
- Keep "--- Page N ---" separators on their own line, unchanged.
- Keep blank lines EXACTLY where they appear in the source — do not add or remove empty lines.
- For "SFX:" lines, adapt the sound to a natural ${target_language} equivalent while keeping the "SFX: " prefix.
- Match the tone of each bubble type: shouts feel forceful, thoughts feel internal, narration stays descriptive, system text stays terse.
- Translate names/terms consistently. If a term has no direct equivalent, transliterate and keep it natural.
- Do NOT add quotation marks, speaker names, translator notes, or any commentary.
- Output ONLY the translated transcript, nothing else.

TRANSCRIPT:
${text}`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, model: 'gpt_5_4' });
    const translated = typeof res === 'string' ? res : (res && (res.text || res.output)) || String(res || '');
    return Response.json({ translated: translated.trim() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}