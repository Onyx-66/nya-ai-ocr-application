import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { X, Send, ImagePlus, Loader2, Sparkles } from 'lucide-react';
import { useOverlayBack } from '@/lib/overlayHistory';

const AGENT_NAME = 'scan_quality_advisor';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${isUser ? 'bg-[hsl(var(--c-accent))] text-white' : 'bg-[hsl(var(--c-soft))] text-[hsl(var(--c-text))] border border-[hsl(var(--c-border))]'}`}>
        {message.content ? (isUser
          ? <p className="whitespace-pre-wrap break-words">{message.content}</p>
          : <div className="prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0 [&_h1]:my-1 [&_h2]:my-1 [&_h3]:my-1"><ReactMarkdown>{message.content}</ReactMarkdown></div>)
          : null}
        {message.tool_calls?.map((tc, i) => (
          <div key={i} className="mt-1.5 flex items-center gap-1.5 text-xs text-[hsl(var(--c-dim))]">
            <Loader2 className="w-3 h-3 animate-spin" /> {tc.name || 'working…'}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScanAdvisor({ open, onClose }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingImg, setPendingImg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const { close } = useOverlayBack('advisor', open, onClose);

  // Load or create a conversation for this agent.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await base44.agents.listConversations({ agent_name: AGENT_NAME });
        let conv = (Array.isArray(list) ? list : list?.conversations || [])?.[0] || null;
        if (!conv) conv = await base44.agents.createConversation({ agent_name: AGENT_NAME, metadata: { name: 'Scan Quality Advisor' } });
        if (cancelled) return;
        setConversationId(conv.id);
        setMessages(conv.messages || []);
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open]);

  // Subscribe to streamed updates.
  useEffect(() => {
    if (!conversationId) return;
    const unsub = base44.agents.subscribeToConversation(conversationId, (data) => {
      const msgs = data?.messages || [];
      setMessages(msgs);
      const last = msgs[msgs.length - 1];
      if (last && last.role === 'assistant') setBusy(false);
    });
    return () => unsub();
  }, [conversationId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const onPickImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPendingImg({ url: file_url, name: file.name });
    } catch { /* ignore */ }
    setUploading(false);
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !pendingImg) || busy) return;
    setBusy(true);
    setInput('');
    try {
      const conv = await base44.agents.getConversation(conversationId);
      const content = text || 'Can you assess the scan quality of this image and tell me how to improve it for OCR?';
      await base44.agents.addMessage(conv, {
        role: 'user',
        content,
        ...(pendingImg ? { file_urls: [pendingImg.url] } : {})
      });
      setPendingImg(null);
    } catch {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-3" onClick={close}>
      <div className="w-full sm:max-w-lg h-[90vh] sm:h-[80vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[hsl(var(--c-border))] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--c-accent))]/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[hsl(var(--c-accent))]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[hsl(var(--c-text))]">Scan Quality Advisor</p>
            <p className="text-[11px] text-[hsl(var(--c-dim))]">Tips to improve your images for OCR</p>
          </div>
          <button onClick={close} className="text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))] p-2 -m-2 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full text-[hsl(var(--c-dim))]"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 text-[hsl(var(--c-dim))]">
              <Sparkles className="w-8 h-8 mb-2 text-[hsl(var(--c-accent))]" />
              <p className="text-sm text-[hsl(var(--c-text-soft))]">Share a manga page and get instant, actionable tips on resolution, lighting, skew, and artifacts to boost your OCR accuracy.</p>
            </div>
          ) : (
            messages.map((m, i) => <MessageBubble key={i} message={m} />)
          )}
        </div>

        {pendingImg && (
          <div className="px-3 pt-2 shrink-0">
            <div className="inline-flex items-center gap-2 bg-[hsl(var(--c-soft))] border border-[hsl(var(--c-border))] rounded-lg px-2 py-1.5">
              <img src={pendingImg.url} alt="" className="w-8 h-8 rounded object-cover" />
              <span className="text-xs text-[hsl(var(--c-text-soft))] truncate max-w-[160px]">{pendingImg.name}</span>
              <button onClick={() => setPendingImg(null)} className="text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))]"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}

        <div className="p-3 border-t border-[hsl(var(--c-border))] shrink-0" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
          <div className="flex items-end gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] text-[hsl(var(--c-text-soft))] disabled:opacity-50">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onPickImage(e.target.files[0]); e.target.value = ''; }} />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask for scan tips, or attach an image…"
              rows={1}
              className="flex-1 min-h-[40px] max-h-32 resize-none bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))] focus:outline-none focus:border-[hsl(var(--c-accent))]"
            />
            <button onClick={send} disabled={busy || (!input.trim() && !pendingImg)} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white disabled:opacity-40">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}