import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { assistantChat, type AssistantGuide } from '../api';

type Msg = { role: 'user' | 'assistant'; text: string; guide?: AssistantGuide | null };

// Map an assistant guide target to the route that hosts the control.
const GUIDE_ROUTES: Record<string, string> = {
  'lang-switcher': '',
  'quick-action': '/applications',
  'nav-my-instruments': '/instruments',
  'nav-my-applications': '/applications',
  'nav-certificates': '/certificates',
  'new-application': '/applications',
  'add-instrument': '/instruments',
};

const SUGGESTIONS = [
  'How do I register an instrument?',
  'How do I create a new application?',
  'How do I change the language?',
  'How do I view my certificates?',
];

const WELCOME =
  'Welcome! I\u2019m your MaapSetu assistant. Ask me how to register an instrument, ' +
  'raise a verification application, change the app language, or check your certificates. ' +
  'I can even point to the right button on this screen.';

function matches(text: string, ...keys: string[]) {
  const lower = text.toLowerCase();
  return keys.some((k) => lower.includes(k));
}

// Offline fallback: keyword answers so the widget never depends on the backend.
function localAnswer(text: string, name?: string): Msg {
  const firstName = (name || '').split(' ')[0] || 'there';

  if (matches(text, 'hi', 'hello', 'hey', 'namaste', 'नमस्ते', 'नमस्कार')) {
    return {
      role: 'assistant',
      text: `Namaste ${firstName}! I can guide you around MaapSetu \u2014 ask me about registering an instrument, creating a verification application, changing the language, or viewing certificates.`,
      guide: null,
    };
  }

  if (matches(text, 'language', 'भाषा', 'translate', 'हिंदी', 'हिन्दी', 'marathi')) {
    return {
      role: 'assistant',
      text: 'You can switch the portal language from the top bar \u2014 the whole interface changes instantly.',
      guide: {
        target: 'lang-switcher',
        steps: [
          'Click the language button in the top bar (right side).',
          'Pick your language from the dropdown.',
        ],
      },
    };
  }

  if (matches(text, 'register', 'add instrument', 'new instrument', 'instrument', 'नया उपकरण', 'उपकरण जोड़ें')) {
    return {
      role: 'assistant',
      text: 'Open My Instruments and tap \u201cAdd Instrument\u201d to register a weighing or measuring device (name, serial number, accuracy class, capacity, location).',
      guide: {
        target: 'nav-my-instruments',
        steps: [
          'Click \u201cMy Instruments\u201d in the left menu.',
          'Tap \u201cAdd Instrument\u201d (top right) and fill in the details.',
          'Save \u2014 the instrument is now ready for a verification application.',
        ],
      },
    };
  }

  if (matches(text, 'apply', 'application', 'आवेदन')) {
    return {
      role: 'assistant',
      text: 'Go to My Applications and raise a new verification application against one of your registered instruments.',
      guide: {
        target: 'nav-my-applications',
        steps: [
          'Click \u201cMy Applications\u201d in the left menu.',
          'Press \u201cNew Application\u201d and choose the instrument to verify.',
          'Submit \u2014 an officer (LMO/GATC) will schedule a field inspection.',
        ],
      },
    };
  }

  if (matches(text, 'certificate', 'प्रमाणपत्र')) {
    return {
      role: 'assistant',
      text: 'Your issued certificates live under \u201cCertificates\u201d. Each one can be downloaded as a PDF and carries a QR code that consumers can scan to verify it.',
      guide: {
        target: 'nav-certificates',
        steps: [
          'Click \u201cCertificates\u201d in the left menu.',
          'Open a certificate to download its PDF or view the QR code.',
        ],
      },
    };
  }

  return {
    role: 'assistant',
    text: `Happy to help, ${firstName}. I can guide you on registering an instrument, creating a verification application, changing the portal language, or viewing certificates \u2014 just ask!`,
    guide: null,
  };
}

export default function ChatWidget({ userName }: { userName?: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', text: WELCOME, guide: null }]);
  const navigate = useNavigate();
  const location = useLocation();
  const listRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const clearHighlight = () => {
    document.querySelectorAll('.maapsetu-help-on').forEach((el) => el.classList.remove('maapsetu-help-on'));
  };

  const runGuide = (guide: AssistantGuide) => {
    const route = GUIDE_ROUTES[guide.target ?? ''];
    const needNav = !!route && !location.pathname.startsWith(route);
    if (needNav) navigate(route);

    const apply = (attempt: number) => {
      clearHighlight();
      const el = document.querySelector<HTMLElement>(`[data-help="${guide.target}"]`);
      if (el) {
        el.classList.add('maapsetu-help-on');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(clearHighlight, 9000);
      } else if (attempt < 8) {
        window.setTimeout(() => apply(attempt + 1), 300);
      }
    };
    window.setTimeout(() => apply(0), needNav ? 350 : 50);
  };

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, busy]);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    []
  );

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    setInput('');
    const history = messages.filter((m) => m.role === 'assistant' && m.text !== WELCOME).map((m) => ({ role: m.role, content: m.text }));
    const next: Msg[] = [...messages, { role: 'user', text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await assistantChat({ message: text, history, lang: 'en' });
      const reply: Msg = { role: 'assistant', text: res.reply, guide: res.guide };
      setMessages([...next, reply]);
      if (res.guide?.target) runGuide(res.guide);
    } catch {
      const fallback = localAnswer(text, userName);
      setMessages([...next, fallback]);
      if (fallback.guide?.target) runGuide(fallback.guide);
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setOpen(false);
    clearHighlight();
  };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="MaapSetu assistant"
          className="fixed bottom-24 right-4 sm:right-6 z-[70] w-[calc(100vw-2rem)] sm:w-96 neu-flat rounded-2xl flex flex-col overflow-hidden animate-slide-up"
        >
          <div className="px-4 py-3 flex items-center gap-2 border-b border-surface-dim bg-background">
            <span className="w-9 h-9 rounded-full neu-btn flex items-center justify-center text-primary text-[20px]">
              <span className="material-symbols-outlined">smart_toy</span>
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-label-lg text-label-lg text-on-surface font-bold leading-tight">MaapSetu Assistant</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant leading-tight">Your onboarding guide</p>
            </div>
            <button onClick={close} className="w-8 h-8 neu-btn rounded-full flex items-center justify-center text-on-surface-variant" aria-label="Close assistant">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div ref={listRef} className="flex flex-col gap-3 overflow-y-auto p-4 max-h-[45vh]">
            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <div key={i} className="ml-auto max-w-[85%] bg-primary text-on-primary rounded-xl rounded-br-sm px-3 py-2 font-body-md text-body-md whitespace-pre-wrap shadow-sm">
                  {msg.text}
                </div>
              ) : (
                <div key={i} className="mr-auto max-w-[90%] flex flex-col gap-2">
                  <div className="bg-surface-container-low text-on-surface rounded-xl rounded-bl-sm px-3 py-2 font-body-md text-body-md whitespace-pre-wrap">
                    {msg.text}
                  </div>
                  {!!msg.guide?.target && msg.guide?.steps?.length ? (
                    <div className="neu-recessed rounded-lg px-3 py-2 flex flex-col gap-1.5">
                      <p className="font-label-sm text-label-sm font-bold text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">touch_app</span> Where to tap
                      </p>
                      {msg.guide.steps.map((step, s) => (
                        <p key={s} className="font-body-md text-body-md text-on-surface-variant flex gap-2">
                          <span className="w-4 h-4 mt-0.5 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">{s + 1}</span>
                          {step}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            )}
            {busy && (
              <div className="mr-auto neu-recessed rounded-xl rounded-bl-sm px-3 py-2 font-body-md text-body-md text-on-surface-variant">
                <span className="material-symbols-outlined animate-pulse text-[16px] align-middle">more_horiz</span> thinking...
              </div>
            )}
          </div>

          <div className="border-t border-surface-dim p-3 flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={busy}
                  className="neu-btn px-2.5 py-1 rounded-full text-primary font-label-sm text-label-sm disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="neu-input-container flex items-center gap-2 rounded-full px-3 py-2 flex-1">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chat</span>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  className="neu-input bg-transparent w-full font-body-md text-body-md placeholder-on-surface-variant/70 text-on-surface outline-none"
                  placeholder="Ask me anything..."
                />
              </div>
              <button
                onClick={() => send()}
                disabled={busy || !input.trim()}
                className="w-10 h-10 rounded-full neu-btn flex items-center justify-center text-primary disabled:opacity-40"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => (open ? close() : setOpen(true))}
        className="fixed bottom-6 right-4 sm:right-6 z-[70] w-14 h-14 rounded-full neu-btn flex items-center justify-center text-primary"
        aria-label="Open MaapSetu assistant"
      >
        <span className="material-symbols-outlined text-[26px]">{open ? 'close' : 'smart_toy'}</span>
        {!open && <span className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background"></span>}
      </button>
    </>
  );
}