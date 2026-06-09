import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  LucideArrowRight, LucideMapPin,
  LucideStar, LucideBus, LucideLayoutDashboard,
  LucideUsers, LucideCheck, LucideSearch,
  LucideTicket, LucideCalendar, LucideCookie, LucideWifi,
  LucideMenu, LucideX
} from 'lucide-react';
import { useUser } from './_context/UserContext';
import './landing.css';

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────
   ILLUSTRATIONS  (SVG product mockups)
───────────────────────────────────────── */

function HeroIllo() {
  return (
    <svg viewBox="0 0 580 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-illo">
      {/* Browser frame */}
      <rect x="0" y="0" width="540" height="380" rx="16" fill="#0D1120" stroke="rgba(16,185,129,0.25)" strokeWidth="1.5"/>
      {/* Browser chrome */}
      <rect x="0" y="0" width="540" height="42" rx="16" fill="#111827"/>
      <rect x="0" y="30" width="540" height="12" fill="#111827"/>
      <circle cx="24" cy="21" r="6" fill="#FF5F57"/>
      <circle cx="44" cy="21" r="6" fill="#FFBD2E"/>
      <circle cx="64" cy="21" r="6" fill="#28CA41"/>
      <rect x="90" y="13" width="280" height="16" rx="8" fill="#1F2937"/>
      <rect x="98" y="18" width="140" height="6" rx="3" fill="rgba(255,255,255,0.15)"/>

      {/* Sidebar */}
      <rect x="0" y="42" width="160" height="338" rx="0" fill="#0A0F1C"/>
      <rect x="16" y="66" width="128" height="36" rx="8" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.3)" strokeWidth="1"/>
      <rect x="28" y="79" width="70" height="10" rx="4" fill="#10B981"/>
      {['My Bookings','Routes','Profile','Settings'].map((_, i) => (
        <rect key={i} x="16" y={118+i*44} width="128" height="36" rx="8" fill="rgba(255,255,255,0.025)"/>
      ))}
      {[118,162,206,250].map((y,i) => (
        <rect key={i} x="28" y={y+13} width={[60,56,44,48][i]} height="10" rx="4" fill="rgba(255,255,255,0.18)"/>
      ))}

      {/* Main content */}
      {/* Header */}
      <rect x="176" y="58" width="200" height="18" rx="6" fill="rgba(255,255,255,0.07)"/>
      <rect x="176" y="58" width="120" height="18" rx="6" fill="rgba(255,255,255,0.12)"/>
      <rect x="464" y="56" width="60" height="22" rx="8" fill="#10B981"/>
      <rect x="470" y="62" width="48" height="10" rx="4" fill="rgba(0,0,0,0.3)"/>

      {/* Stats row */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x={176+i*90} y="90" width="82" height="62" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
          <rect x={186+i*90} y="102" width={[44,38,52,40][i]} height="8" rx="3" fill="rgba(255,255,255,0.3)"/>
          <rect x={186+i*90} y="114" width={[28,34,24,32][i]} height="22" rx="4" fill={i===0 ? '#10B981' : 'rgba(255,255,255,0.15)'}/>
          <rect x={186+i*90} y="138" width={[36,42,30,38][i]} height="6" rx="2" fill="rgba(255,255,255,0.1)"/>
        </g>
      ))}

      {/* Booking cards */}
      {[0,1,2].map(i => (
        <g key={i}>
          <rect x="176" y={168+i*58} width="348" height="50" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
          <rect x="190" y={180+i*58} width={[80,72,88][i]} height="10" rx="4" fill="rgba(255,255,255,0.3)"/>
          <rect x="190" y={194+i*58} width={[56,64,48][i]} height="8" rx="3" fill="rgba(255,255,255,0.1)"/>
          <rect x={412} y={180+i*58} width="96" height="10" rx="4" fill="rgba(255,255,255,0.08)"/>
          <rect x={430} y={194+i*58} width={60} height="8" rx="3" fill="rgba(16,185,129,0.4)"/>
          {/* Status pill */}
          <rect x={340} y={179+i*58} width={60} height={18} rx="9" fill={i===0 ? 'rgba(16,185,129,0.15)' : i===1 ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)'} stroke={i===0 ? 'rgba(16,185,129,0.4)' : i===1 ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'} strokeWidth="1"/>
          <rect x={348} y={185+i*58} width={44} height={6} rx="3" fill={i===0 ? '#10B981' : i===1 ? '#3B82F6' : 'rgba(255,255,255,0.2)'}/>
        </g>
      ))}

      {/* Map preview in bottom right of dashboard */}
      <rect x="176" y="344" width="168" height="60" rx="10" fill="#0D1B2A" stroke="rgba(16,185,129,0.2)" strokeWidth="1"/>
      <line x1="176" y1="370" x2="344" y2="370" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      <line x1="260" y1="344" x2="260" y2="404" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      <path d="M196 390 Q220 370 240 358 Q260 346 280 350" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 3" fill="none"/>
      <circle cx="196" cy="390" r="5" fill="#10B981"/>
      <circle cx="280" cy="350" r="5" fill="#FF6B6B"/>

      {/* Activity chart */}
      <rect x="352" y="344" width="172" height="60" rx="10" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      {[0,1,2,3,4,5,6].map(i => (
        <rect key={i} x={364+i*22} y={404-[20,32,16,38,26,42,30][i]} width="14" height={[20,32,16,38,26,42,30][i]} rx="3" fill={i===5 ? '#10B981' : 'rgba(16,185,129,0.25)'}/>
      ))}

      {/* Floating notification */}
      <rect x="390" y="20" width="180" height="52" rx="12" fill="#0F2418" stroke="#10B981" strokeWidth="1" filter="url(#glow)"/>
      <circle cx="410" cy="46" r="10" fill="rgba(16,185,129,0.2)"/>
      <path d="M405 46 L408 49 L415 42" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="426" y="38" width="90" height="8" rx="3" fill="rgba(255,255,255,0.6)"/>
      <rect x="426" y="50" width="60" height="6" rx="2" fill="rgba(16,185,129,0.5)"/>
    </svg>
  );
}

const REVIEWS = [
  { name: 'Adaeze O.', role: 'Year 4, UNILAG',   quote: 'Booking takes under a minute and the buses are always on time. Never going back to motor parks.' },
  { name: 'Emeka N.',  role: 'Postgrad, UNN',     quote: 'Affordable fares, safe drivers, real-time tracking. I\'ve stopped dreading inter-city travel.' },
  { name: 'Fatima A.', role: 'Year 2, BUK',       quote: 'The student discount alone sold me. Clean coaches, verified drivers, support that actually responds.' },
  { name: 'Chidi O.',  role: 'Year 3, UNIBEN',    quote: 'I used to spend hours at motor parks. Now I book my seat from my hostel room.' },
  { name: 'Amara S.',  role: 'Final Year, OAU',   quote: 'Every ride has been on time. Professional drivers and air-conditioned coaches. Absolutely love it.' },
  { name: 'Tunde B.',  role: 'Year 2, UI',        quote: 'Whether I need to get home for the holidays or visit a friend, UNIRIDE has me covered.' },
  { name: 'Ngozi E.',  role: 'Postgrad, UNIPORT', quote: 'This app changed my routine. My commute is fully sorted in advance every single time.' },
  { name: 'Yusuf I.',  role: 'Year 4, ABU',       quote: 'Safe, affordable, and the live tracking gives my parents total peace of mind on every trip.' },
];

/* ─── Scroll-Reveal Text Helper ─── */
function ScrollRevealText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="ur2-reveal-word">
          {word}{' '}
        </span>
      ))}
    </span>
  );
}

/* ─── CTA illustration: two overlapping booking cards ─── */
function CtaIllo() {
  return (
    <div className="ur2-cta-illo">
      <div className="ur2-cta-card-back">
        <div className="ur2-cta-card-brow">
          <LucideBus size={13} />
          <span>UNIRIDE</span>
        </div>
        <div className="ur2-cta-card-bchip" />
      </div>
      <div className="ur2-cta-card-front">
        <div className="ur2-cta-card-fhead">
          <div className="ur2-cta-card-flogo"><LucideBus size={12} /><span>UNIRIDE</span></div>
          <span className="ur2-cta-card-ftag">E-Ticket</span>
        </div>
        <div className="ur2-cta-card-froute">Ede → Lagos</div>
        <div className="ur2-cta-card-fmeta">
          <span>Seat 12A · Dep 07:00</span>
          <span className="ur2-cta-card-fprice">₦8,500</span>
        </div>
        <div className="ur2-cta-card-fbar" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   HOW IT WORKS — live demo screens
───────────────────────────────────────── */
const HIW_STEPS = [
  { num: '01', label: 'Search Routes',  sub: 'Find available rides from campus instantly.' },
  { num: '02', label: 'Pick & Pay',     sub: 'Select your seat and pay securely in-app.' },
  { num: '03', label: 'Seat Confirmed', sub: 'Your e-ticket arrives in seconds.' },
  { num: '04', label: 'Track & Travel', sub: 'Board with your phone — track live.' },
];
const HIW_URLS = [
  'uniride.ng/dashboard/browse',
  'uniride.ng/dashboard/browse',
  'uniride.ng/dashboard/bookings',
  'uniride.ng/dashboard',
];
const DEMO_TRIPS = [
  { co: 'K', name: 'KV Transport',           dest: 'Lagos',  time: '07:00 AM', price: '₦8,500', rating: '4.8' },
  { co: 'N', name: 'Noble Travels',           dest: 'Lagos',  time: '09:30 AM', price: '₦8,000', rating: '4.6' },
  { co: 'P', name: 'Pleasure Transport',      dest: 'Ibadan', time: '08:00 AM', price: '₦3,200', rating: '4.9' },
];

function DemoSidebar({ active }: { active: number }) {
  const items = [
    { icon: <LucideLayoutDashboard size={11} />, label: 'Overview' },
    { icon: <LucideSearch size={11} />,          label: 'Browse'   },
    { icon: <LucideTicket size={11} />,          label: 'Bookings' },
    { icon: <LucideUsers size={11} />,           label: 'Profile'  },
  ];
  return (
    <div className="hiw-sidebar">
      <div className="hiw-sb-brand"><LucideBus size={12} color="#fff" /></div>
      {items.map((it, i) => (
        <div key={it.label} className={`hiw-sb-item${i === active ? ' active' : ''}`}>
          {it.icon}<span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function DemoBrowse({ highlight }: { highlight?: boolean }) {
  return (
    <div className="hiw-screen">
      <DemoSidebar active={1} />
      <div className="hiw-main">
        <div className="hiw-main-head">
          <span className="hiw-main-title">Browse Trips</span>
          <div className="hiw-main-searchbar">
            <LucideSearch size={9} />
            <span>Lagos</span>
          </div>
          <div className="hiw-main-date"><LucideCalendar size={9} /><span>25 Apr</span></div>
        </div>
        <p className="hiw-results-lbl"><strong>4</strong> trips available today</p>
        <div className="hiw-trips">
          {DEMO_TRIPS.map((t, i) => (
            <div key={t.name} className={`hiw-trip${highlight && i === 0 ? ' selected' : ''}`}>
              <div className="hiw-co-dot">{t.co}</div>
              <div className="hiw-trip-info">
                <p className="hiw-trip-name">{t.name}</p>
                <p className="hiw-trip-route">Campus → {t.dest} · {t.time}</p>
              </div>
              <div className="hiw-trip-tail">
                <p className="hiw-trip-price">{t.price}</p>
                <div className={`hiw-book-btn${highlight && i === 0 ? ' lit' : ''}`}>Book</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DemoPayment() {
  return (
    <div className="hiw-screen hiw-screen-overlay">
      <div className="hiw-overlay-bg"><DemoBrowse highlight /></div>
      <div className="hiw-dim" />
      <div className="hiw-modal">
        <p className="hiw-modal-title">Confirm Booking</p>
        <div className="hiw-modal-route-row">
          <span>Ede Campus</span>
          <LucideArrowRight size={11} />
          <span>Lagos</span>
        </div>
        <div className="hiw-modal-details">
          <div className="hiw-modal-kv"><span>Company</span><strong>KV Transport</strong></div>
          <div className="hiw-modal-kv"><span>Date</span><strong>25 Apr 2026</strong></div>
          <div className="hiw-modal-kv"><span>Departs</span><strong>07:00 AM</strong></div>
          <div className="hiw-modal-kv"><span>Price</span><strong className="green">₦8,500</strong></div>
        </div>
        <div className="hiw-pay-tabs">
          <div className="hiw-pay-tab active">Card</div>
          <div className="hiw-pay-tab">Transfer</div>
          <div className="hiw-pay-tab">Wallet</div>
        </div>
        <div className="hiw-card-fields">
          <div className="hiw-card-num">4532 •••• •••• 1234</div>
          <div className="hiw-card-row">
            <div className="hiw-card-half">John Doe</div>
            <div className="hiw-card-half">12/27 · 321</div>
          </div>
        </div>
        <div className="hiw-pay-cta">Pay ₦8,500 →</div>
      </div>
    </div>
  );
}

function DemoConfirmed() {
  return (
    <div className="hiw-screen hiw-screen-confirmed">
      <div className="hiw-conf-inner">
        <div className="hiw-conf-check"><LucideCheck size={22} color="#fff" strokeWidth={3} /></div>
        <p className="hiw-conf-title">Booking Confirmed!</p>
        <p className="hiw-conf-sub">Your seat is reserved. E-ticket ready.</p>
        <div className="hiw-eticket">
          <div className="hiw-et-head">
            <div className="hiw-et-logo"><LucideBus size={11} /><span>UNIRIDE</span></div>
            <div className="hiw-et-ref">BK-0042</div>
          </div>
          <div className="hiw-et-route">Ede Campus → Lagos</div>
          <div className="hiw-et-grid">
            <div className="hiw-et-kv"><span>Date</span><strong>25 Apr 2026</strong></div>
            <div className="hiw-et-kv"><span>Seat</span><strong>12A</strong></div>
            <div className="hiw-et-kv"><span>Dep.</span><strong>07:00 AM</strong></div>
            <div className="hiw-et-kv"><span>Price</span><strong>₦8,500</strong></div>
          </div>
          <div className="hiw-et-bar" />
        </div>
      </div>
    </div>
  );
}

function DemoDashboard() {
  return (
    <div className="hiw-screen">
      <DemoSidebar active={0} />
      <div className="hiw-main">
        <div className="hiw-main-head">
          <span className="hiw-main-title">Overview</span>
          <div className="hiw-live-badge"><LucideWifi size={9} /><span>Live</span></div>
        </div>
        <div className="hiw-upcoming-card">
          <div className="hiw-uc-left">
            <p className="hiw-uc-label">Upcoming Trip</p>
            <p className="hiw-uc-route">Ede → Lagos</p>
            <p className="hiw-uc-meta">25 Apr · 07:00 AM · KV Transport</p>
          </div>
          <span className="hiw-uc-badge">CONFIRMED</span>
        </div>
        <div className="hiw-stats-row">
          <div className="hiw-stat-box"><p className="sv">3</p><p className="sl">Trips</p></div>
          <div className="hiw-stat-box"><p className="sv">₦24K</p><p className="sl">Spent</p></div>
          <div className="hiw-stat-box"><p className="sv">4.9★</p><p className="sl">Rating</p></div>
        </div>
        <div className="hiw-bk-row">
          <div className="hiw-bk-icon"><LucideTicket size={11} /></div>
          <div className="hiw-bk-info">
            <p className="hiw-bk-name">Campus → Lagos</p>
            <p className="hiw-bk-meta">25 Apr · Seat 12A · BK-0042</p>
          </div>
          <span className="hiw-bk-status">Confirmed</span>
        </div>
        <div className="hiw-bk-row dim">
          <div className="hiw-bk-icon"><LucideTicket size={11} /></div>
          <div className="hiw-bk-info">
            <p className="hiw-bk-name">Campus → Ibadan</p>
            <p className="hiw-bk-meta">18 Apr · Seat 5B · BK-0038</p>
          </div>
          <span className="hiw-bk-status completed">Completed</span>
        </div>
      </div>
    </div>
  );
}

/* Cursor positions (% of screen-wrap) for each step */
const HIW_CURSOR_POS = [
  { x: 83, y: 42 },   // Browse: Book button on first card
  { x: 50, y: 91 },   // Payment: Pay button
  { x: 50, y: 58 },   // Confirmed: e-ticket
  { x: 62, y: 32 },   // Dashboard: upcoming card
];

function HiwCursor({ step, tick }: { step: number; tick: number }) {
  const { x, y } = HIW_CURSOR_POS[step];
  return (
    <div key={tick} className="hiw-cursor" style={{ left: `${x}%`, top: `${y}%` }}>
      <svg className="hiw-cursor-ptr" width="20" height="24" viewBox="0 0 20 24" fill="none">
        <path d="M0 0L0 18L5 13L8 21L11 20L8 12L14 12Z" fill="#1a1a2e" stroke="#fff" strokeWidth="1.2"/>
      </svg>
      <div className="hiw-cursor-ring" />
    </div>
  );
}

function HowItWorksDemo({ step, tick, onSetStep }: { step: number; tick: number; onSetStep: (s: number) => void }) {
  return (
    <div className="hiw-demo-wrap">
      <div className="hiw-browser">
        <div className="hiw-chrome">
          <div className="hiw-chrome-dots"><span /><span /><span /></div>
          <div className="hiw-chrome-url">{HIW_URLS[step]}</div>
          <div style={{ width: 52 }} />
        </div>
        <div className="hiw-chrome-progress" key={tick}>
          <div className="hiw-chrome-fill" />
        </div>
        <div className="hiw-screen-wrap">
          {step === 0 && <DemoBrowse    key="browse" />}
          {step === 1 && <DemoPayment   key="pay"    />}
          {step === 2 && <DemoConfirmed key="conf"   />}
          {step === 3 && <DemoDashboard key="dash"   />}
          <HiwCursor step={step} tick={tick} />
        </div>
      </div>

      <div className="hiw-step-pills">
        {HIW_STEPS.map((s, i) => (
          <div key={i} className={`hiw-pill${step === i ? ' active' : ''}`} onClick={() => onSetStep(i)} style={{ cursor: 'pointer' }}>
            <span className="hiw-pill-num">{s.num}</span>
            <span className="hiw-pill-label">{s.label}</span>
            <span className="hiw-pill-sub">{s.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── count-up hook ─── */
function useCountUp(target: number, decimals = 0, duration = 2000, delay = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const p = Math.min((now - t0) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setCount(decimals > 0
          ? Math.round(ease * target * 10 ** decimals) / 10 ** decimals
          : Math.round(ease * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (delay > 0) { timeoutId = setTimeout(run, delay); } else { run(); }
    return () => { cancelled = true; if (timeoutId !== undefined) clearTimeout(timeoutId); };
  }, []);
  return count;
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function LandingPage() {
  const { user, loading } = useUser();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [cookies, setCookies]         = useState(() => {
    try {
      return localStorage.getItem('ur_cookies') === '1';
    } catch {
      return false;
    }
  });
  const [cookieOpen, setCookieOpen]   = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);

  const heroRef  = useRef<HTMLElement>(null);
  const hiwRef   = useRef<HTMLElement>(null);
  const hiwStepRef = useRef(0);

  const [hiwStep, setHiwStep] = useState(0);
  const [hiwTick, setHiwTick] = useState(0);

  const rides  = useCountUp(2000, 0, 2200, 1200);
  const routes = useCountUp(15,   0, 1800, 1200);
  const onTime = useCountUp(98,   0, 2000, 1200);
  const rating = useCountUp(4.9,  1, 2400, 1200);

  const handleGoogleLogin = async (googleResponse: any) => {
    const email = googleResponse.profileObj.email;
    if (!email.endsWith('@run.edu.ng')) {
      alert('Access Denied: You must use your @run.edu.ng institutional email to join the UniRide student network.');
      return;
    }
    // Proceed with authentication...
    console.log('Verified RUN student:', email);
  };

  useEffect(() => {
    document.body.classList.add('landing-theme');
    return () => document.body.classList.remove('landing-theme');
  }, []);

  useEffect(() => {
    document.body.classList.toggle('landing-menu-open', menuOpen);
    return () => document.body.classList.remove('landing-menu-open');
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {

      /* ── Hero entrance ── */
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.ur2-hero-eyebrow', { y: 20, opacity: 0, duration: 0.6 }, 0.2)
        .from('.ur2-h1 .line',    { y: 70, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.4)
        .from('.ur2-hero-sub',    { y: 20, opacity: 0, duration: 0.7 }, 0.75)
        .from('.ur2-hero-ctas',   { y: 18, opacity: 0, duration: 0.6 }, 0.95)
        .from('.ur2-hero-illo-wrap', { x: 40, opacity: 0, duration: 0.9 }, 0.5)
        .from('.ur2-stats-strip', { y: 20, opacity: 0, duration: 0.6 }, 1.15);

      /* ── Pop out search once ── */
      gsap.delayedCall(2.5, () => {
        setSearchOpen(true);
        gsap.delayedCall(4, () => setSearchOpen(false));
      });

      /* ── Parallax ── */
      if (heroRef.current) {
        gsap.to('.ur2-para-bg', {
          yPercent: -30,
          ease: 'none',
          scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true },
        });
        gsap.to('.ur2-para-orbs', {
          yPercent: -50,
          ease: 'none',
          scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true },
        });
        gsap.to('.ur2-hero-inner', {
          yPercent: -12,
          opacity: 0.4,
          ease: 'none',
          scrollTrigger: { trigger: heroRef.current, start: '40% top', end: 'bottom top', scrub: true },
        });
      }

      /* ── Scroll-reveal ── */
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(el => {
        gsap.from(el, {
          y: 48, opacity: 0, duration: 0.85, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        });
      });

      /* ── Word-by-word reveal with Scroll Pinning ── */
      gsap.timeline({
        scrollTrigger: {
          trigger: '.ur2-pillars-section',
          start: 'top top',
          end: '+=250%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      }).to('.ur2-reveal-word', {
        opacity: 1,
        color: '#ffffff',
        stagger: 0.12,
        duration: 1,
        ease: 'none',
      });

      /* ── HIW demo scroll-pin (Desktop Only) ── */
      const mm = gsap.matchMedia(hiwRef);
      mm.add("(min-width: 901px)", () => {
        if (hiwRef.current) {
          ScrollTrigger.create({
            trigger: hiwRef.current,
            start: 'top top',
            end: '+=350%',
            pin: true,
            anticipatePin: 1,
            scrub: 0.4,
            onUpdate(self) {
              const s = Math.min(3, Math.floor(self.progress * 4 + 0.005));
              if (s !== hiwStepRef.current) {
                hiwStepRef.current = s;
                setHiwStep(s);
                setHiwTick(t => t + 1);
              }
            },
          });
        }
      });

      gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach(parent => {
        gsap.from(parent.querySelectorAll(':scope > *'), {
          y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: { trigger: parent, start: 'top 85%', toggleActions: 'play none none none' },
        });
      });

    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="landing-theme">
      <div className="ur2-root">

      {/* ── Navbar ── */}
      <nav className={`ur2-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="ur2-nav-inner">
          <a href="#" className="ur2-logo">uni<span>ride</span></a>

          {/* DESKTOP LINKS (Hidden on mobile) */}
          <div className="ur2-nav-links ur2-desktop-only-links">
            <a href="#features">Features</a>
            <a href="#routes">Routes</a>
            <a href="#howitworks">How it Works</a>
            <a href="#reviews">Reviews</a>
          </div>

          {/* Hamburger button with animation */}
          <div className="ur2-nav-right">
            <Link to={user ? (user.accountType === 'logistics' ? '/vendor' : '/dashboard') : '/login'} className="ur2-nav-login ur2-nav-desktop-only" onClick={() => setMenuOpen(false)}>
              {user ? 'Go to Dashboard' : 'Sign In'}
            </Link>
            <Link to={user ? '/dashboard/browse' : '/signup'} className="ur2-nav-signup ur2-nav-desktop-only" onClick={() => setMenuOpen(false)}>
              {user ? 'Book a Ride' : 'Get Started'}
            </Link>
            <button
              className={`ur2-hamburger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER (Rendered OUTSIDE of the nav to escape the backdrop-filter trap) */}
      <div id="landing-mobile-menu" className={`ur2-mobile-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="ur2-mobile-drawer-links">
          <a href="#features"   onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#routes"     onClick={() => setMenuOpen(false)}>Routes</a>
          <a href="#howitworks" onClick={() => setMenuOpen(false)}>How it Works</a>
          <a href="#reviews"    onClick={() => setMenuOpen(false)}>Reviews</a>
        </div>
        
        <div className="ur2-nav-mobile-ctas">
          <Link to={user ? (user.accountType === 'logistics' ? '/vendor' : '/dashboard') : '/login'} className="ur2-nav-login" onClick={() => setMenuOpen(false)}>
            {user ? 'Go to Dashboard' : 'Sign In'}
          </Link>
          <Link to={user ? '/dashboard/browse' : '/signup'} className="ur2-nav-signup" onClick={() => setMenuOpen(false)}>
            {user ? 'Book a Ride' : 'Get Started'}
          </Link>
        </div>
      </div>
      {menuOpen && <div className="ur2-nav-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      {/* ── Hero ── */}
      <section className="ur2-hero" ref={heroRef}>
        <div className="ur2-para-bg">
          <div className="ur2-grid-overlay" />
        </div>
        <div className="ur2-para-orbs">
          <div className="ur2-orb ur2-orb-a" />
          <div className="ur2-orb ur2-orb-b" />
          <div className="ur2-orb ur2-orb-c" />
          <div className="ur2-dot-cluster" />
        </div>

        <div className="ur2-hero-inner">
          <div className="ur2-hero-left">
            <h1 className="ur2-h1">
              <span className="line">The Official Hub for</span>
              <span className="line accent">Campus Travel.</span>
            </h1>
            <p className="ur2-hero-sub">
              One platform. Every agency. Book and pay for your travel from Redeemer's University to any city in Nigeria, all in one place.
            </p>
          </div>

          <div className="ur2-stats-strip">
            <div className="ur2-stat-item">
              <span className="val">{rides.toLocaleString()}+</span>
              <span className="lbl">Rides Booked</span>
            </div>
            <div className="ur2-stat-sep" />
            <div className="ur2-stat-item">
              <span className="val">{routes}+</span>
              <span className="lbl">Routes Covered</span>
            </div>
            <div className="ur2-stat-sep" />
            <div className="ur2-stat-item">
              <span className="val">{onTime}%</span>
              <span className="lbl">On-Time Rate</span>
            </div>
            <div className="ur2-stat-sep" />
            <div className="ur2-stat-item">
              <span className="val">{rating.toFixed(1)}</span>
              <span className="lbl">Avg Rating</span>
            </div>
          </div>
        </div>

        <div className="ur2-hero-scroll-hint">
          <div className="ur2-scroll-mouse"><div className="ur2-scroll-wheel" /></div>
        </div>

        {/* --- Partners Ribbon --- */}
        <div className="ur2-partners-strip">
          <p>Official Partners</p>
          <div className="ur2-partners-track">
            {['KV Transport', 'Pleasure Transport', 'Noble Travels', 'Tish Transportation Services', 'KV Transport', 'Pleasure Transport', 'Noble Travels', 'Tish Transportation Services'].map((p, i) => (
              <span key={i} className="partner-logo">{p}</span>
            ))}
            {/* Duplicate for seamless loop */}
            {['KV Transport', 'Pleasure Transport', 'Noble Travels', 'Tish Transportation Services', 'KV Transport', 'Pleasure Transport', 'Noble Travels', 'Tish Transportation Services'].map((p, i) => (
              <span key={`d${i}`} className="partner-logo">{p}</span>
            ))}
          </div>
        </div>

        <div className="ur2-section-blend" />
      </section>

      {/* ── Value Pillars — scroll word-reveal ── */}
      <section className="ur2-pillars-section">
        <div className="ur2-container">
          <div className="ur2-section-label">The UNIRIDE platform</div>

          <h2 className="ur2-section-h2 centered" style={{ maxWidth: '900px', margin: '0 auto 2rem' }}>
            <ScrollRevealText
              text="One account. Every logistics provider in school. Stop jumping between different apps and motor parks. UNIRIDE unifies all transport agencies into a single, secure booking experience."
            />
          </h2>

          <div className="ur2-content-expanded">
            <p className="ur2-section-sub centered">
              <ScrollRevealText
                text="Redefining the campus commute for over 10,000 students. We've built the infrastructure so you can focus on your lectures, not your luggage. Institutional security, verified partners, and a seamless digital wallet—everything you need to move across Nigeria from the heart of RUN."
              />
            </p>
          </div>
        </div>
        <div className="ur2-section-blend" />
      </section>

      {/* ── How It Works ── */}
      <section className="ur2-section ur2-hiw-section" id="howitworks" ref={hiwRef}>
        <div className="ur2-container">
          <div className="ur2-section-label" data-reveal>How It Works</div>
          <h2 className="ur2-section-h2 centered" data-reveal>See the platform in action</h2>
          <p className="ur2-section-sub centered" data-reveal>
            A live walkthrough of the actual UNIRIDE app — from search to seat.
          </p>
          <HowItWorksDemo step={hiwStep} tick={hiwTick} onSetStep={(s) => { hiwStepRef.current = s; setHiwStep(s); setHiwTick(t => t + 1); }} />
        </div>
        <div className="ur2-section-blend" />
      </section>

      {/* ── Reviews ── */}
      <section className="ur2-reviews-section" id="reviews">
        <div className="ur2-container">
          <div className="ur2-section-label" data-reveal>Student Reviews</div>
          <h2 className="ur2-section-h2 centered" data-reveal>What students are saying</h2>
          <p className="ur2-section-sub centered" data-reveal>Real feedback from students across Nigerian universities.</p>
        </div>
        <div className="ur2-marquee">
          <div className="ur2-marquee-track scroll-left">
            {[...REVIEWS, ...REVIEWS].map((r, i) => (
              <div key={i} className="ur2-review-card">
                <div className="stars">{[...Array(5)].map((_, j) => <LucideStar key={j} size={12} fill="currentColor" />)}</div>
                <p className="quote">"{r.quote}"</p>
                <div className="author">
                  <div className="avatar">{r.name.charAt(0)}</div>
                  <div><p className="name">{r.name}</p><p className="role">{r.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="ur2-marquee">
          <div className="ur2-marquee-track scroll-right">
            {[...REVIEWS.slice().reverse(), ...REVIEWS.slice().reverse()].map((r, i) => (
              <div key={i} className="ur2-review-card">
                <div className="stars">{[...Array(5)].map((_, j) => <LucideStar key={j} size={12} fill="currentColor" />)}</div>
                <p className="quote">"{r.quote}"</p>
                <div className="author">
                  <div className="avatar">{r.name.charAt(0)}</div>
                  <div><p className="name">{r.name}</p><p className="role">{r.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="ur2-section-blend" />
      </section>

      {/* ── CTA ── */}
      <section className="ur2-cta-section">
        <div className="ur2-container">
          <div className="ur2-cta-card" data-reveal>
            <div className="ur2-cta-left">
              <h2 className="ur2-cta-h2">
                Ready to travel<br /><em>without the stress?</em>
              </h2>
              <p className="ur2-cta-sub">
                Built exclusively for Redeemer's University students — book your Ede–Lagos ride in under a minute.
              </p>
              <Link to={user ? '/dashboard/browse' : '/signup'} className="ur2-cta-btn">
                {user ? 'View Routes' : 'Book a Ride Free'} <LucideArrowRight size={15} />
              </Link>
            </div>
            <div className="ur2-cta-right">
              <CtaIllo />
            </div>
          </div>
        </div>
      </section>

      {/* ── Cookie preferences button (bottom-left) ── */}
      <button className="ur2-theme-btn" onClick={() => setCookieOpen(o => !o)} aria-label="Cookie preferences" title="Cookie Preferences">
        <LucideCookie size={18} />
      </button>

      {/* ── Cookie Banner ── */}
      {(cookieOpen || !cookies) && (
        <div className={`ur2-cookie-banner${cookieOpen ? ' instant' : ''}`}>
          <div className="ur2-cookie-text">
            <span className="ur2-cookie-icon"><LucideCookie size={20} /></span>
            <p>We use cookies to improve your experience. By continuing to use UNIRIDE, you agree to our <a href="#">Cookie Policy</a>.</p>
          </div>
          <div className="ur2-cookie-actions">
            <button className="ur2-cookie-decline" onClick={() => {
              setCookies(true);
              setCookieOpen(false);
              try { localStorage.setItem('ur_cookies', '0'); } catch {
                // Ignore storage failures in privacy-restricted browsers.
              }
            }}>Decline</button>
            <button className="ur2-cookie-accept"  onClick={() => {
              setCookies(true);
              setCookieOpen(false);
              try { localStorage.setItem('ur_cookies', '1'); } catch {
                // Ignore storage failures in privacy-restricted browsers.
              }
            }}>Accept All</button>
          </div>
        </div>
      )}

      {/* ── Quick Book Button (bottom-right) ── */}
      <div className="ur2-search-wrapper">
        <button className="ur2-search-trigger-btn" onClick={() => setSearchOpen(o => !o)} aria-label="Quick book" title="Quick Book">
          <LucideSearch size={18} />
        </button>

        {searchOpen && (
          <div className="ur2-search-popup">
            <div className="ur2-search-popup-label">
              <LucideMapPin size={14} /> Quick Book
            </div>
            <div className="ur2-search-popup-field">
              <LucideMapPin size={15} className="field-icon" />
              <div className="field-body">
                <span className="field-label">Destination</span>
                <input type="text" placeholder="Where are you going?" />
              </div>
            </div>
            <div className="ur2-search-popup-divider" />
            <div className="ur2-search-popup-field">
              <LucideCalendar size={15} className="field-icon" />
              <div className="field-body">
                <span className="field-label">Departure Date</span>
                <input type="date" />
              </div>
            </div>
            <Link to={user ? '/dashboard/browse' : '/signup'} className="ur2-search-popup-btn">
              Search Rides <LucideArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="ur2-footer">

        {/* Full image section — logo, tagline, and columns all sit on the photo */}
        <div className="ur2-footer-hero">
          <div className="ur2-footer-hero-inner">

            <div className="ur2-footer-hero-top">
              <span className="ur2-footer-hero-logo">uni<span>ride</span></span>
              <span className="ur2-footer-hero-tag">Campuses Connected. Students Moving.</span>
            </div>

            <div className="ur2-footer-cols">
              <div className="ur2-footer-col">
                <h4>MENU</h4>
                <a href="#">Home</a>
                <a href="#">Book a Ride</a>
                <a href="#">My Bookings</a>
                <a href="/dashboard">Dashboard</a>
              </div>
              <div className="ur2-footer-col">
                <h4>SOCIALS</h4>
                <a href="#">Twitter / X</a>
                <a href="#">Instagram</a>
                <a href="#">LinkedIn</a>
                <a href="#">WhatsApp</a>
              </div>
              <div className="ur2-footer-col">
                <h4>RESOURCES</h4>
                <a href="#">How it Works</a>
                <a href="#">Support</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
              </div>
            </div>

          </div>
        </div>

      </footer>

    </div>
  </div>
  );
}
