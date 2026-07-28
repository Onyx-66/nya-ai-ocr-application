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

    const prompt = `You are a professional manga / manhwa / webtoon translator.
Translate the following OCR transcript from its original language into ${target_language}.

Preserve ALL structural formatting EXACTLY as-is:
- Keep page separators on their own line ("--- Page N ---").
- Keep "## " prefixes for narration lines.
- Keep "SFX: " prefixes for sound-effect lines — translate the sound/meaning naturally for ${target_language}.
- Keep one speech bubble per line, in the same order.
- Do NOT add quotes, speaker names, notes, or any commentary.
- Output ONLY the translated text, nothing else.

TRANSCRIPT:
${text}`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const translated = typeof res === 'string' ? res : (res && (res.text || res.output)) || String(res || '');
    return Response.json({ translated: translated.trim() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}