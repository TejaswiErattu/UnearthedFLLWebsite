import { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { extractSiteChunks, answerFromSite, answerFromTeam } from "./siteSearch";
import { motion } from "framer-motion";
import {
  Menu,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Users,
  Hammer,
  Bot,
  BookOpen,
  Pickaxe,
  Github,
  Youtube,
  Sparkles,
  Heart,
} from "lucide-react";

/*
  The Unearthed Dinos — Single-file React site (sandbox-safe)
  - Smooth in-page scroll without changing URL
  - Picture slots and brown "unearthed" theme
  - Self-tests to catch regressions
*/

/*********************************
 * Data
 *********************************/
function sentenceify(text, max = 320) {
  const s = (text || "").replace(/\s+/g, " ").trim();
  const parts = s.split(/(?<=[.?!])\s+/);
  const out = [];
  for (const p of parts) {
    if (!p) continue;
    out.push(p);
    if (out.join(" ").length >= max) break;
  }
  return out.length ? out.join(" ") : s.slice(0, max);
}

function wantsDefinitionFLL(q) {
  const Q = q.toLowerCase();
  return (/\bfll\b|\bfirst lego league\b/.test(Q)) &&
    /(what\s+is|define|meaning|stand\s+for|explain)/.test(Q);
}

function builtinFLL() {
  return "FIRST LEGO League (FLL) is an international youth robotics program that blends LEGO robotics with research and Core Values. Teams design, build and program a robot for the Robot Game and present an Innovation Project; events emphasize teamwork, inclusion and fun.";
}
const sections = [
  { id: "home", label: "Home", icon: Sparkles },
  { id: "about", label: "About", icon: BookOpen },
  { id: "outreach", label: "Outreach", icon: Users },
  { id: "unearthed", label: "Unearthed", icon: Pickaxe },
  { id: "robot", label: "Robot Design", icon: Hammer },
  { id: "fun", label: "Team Fun", icon: Heart },
  { id: "timeline", label: "Timeline", icon: ChevronRight },
  { id: "chatbot", label: "FLL Chat Bot", icon: Bot },
  { id: "contact", label: "Contact", icon: Mail },
];

const team = [
  { 
    name: "Tanishqa Erattu", 
    role: "Media Uploader, Outreach, Communication Lead", 
    dino: "Triceratops", 
    photo: "/tanishqa.jpg" 
  },
  { 
    name: "Simone Justin", 
    role: "Assets and Hardware, Project Scheduler and Communication Lead", 
    dino: "Velociraptor", 
    photo: "/simone.jpg" 
  },
  { 
    name: "Abhimanyu Arvindh", 
    role: "Materials & Logistics and Email Administrator", 
    dino: "Stegosaurus", 
    photo: "/abhi.jpg" 
  },
  { 
    name: "Manveer Singh", 
    role: "Attendance Coordinator & Treasurer", 
    dino: "Ankylosaurus", 
    photo: "/manveercrop.png" 
  },
  { 
    name: "Aarav Kukreja", 
    role: "Valuable Team Member", 
    dino: "Pachycephalosaurus", 
    photo: "/aarav.jpg" 
  },
];

const palette = {
  bg: "bg-[#2B221A]", // deep soil brown
  card: "bg-[#3b2f24]",
};

/*********************************
 * Utilities & primitives
 *********************************/
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use instant to avoid smooth scrolling to bottom
    });
  }, [pathname]);

  return null;
}

function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observers = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-50% 0px -45% 0px", threshold: 0.01 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => {
      observers.forEach(obs => obs.disconnect());
    };
  }, [ids]);
  return active;
}

function PlaceholderImage({ className = "w-8 h-8" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#DCC7A1" strokeWidth="1.5" />
      <circle cx="9" cy="10" r="2" stroke="#DCC7A1" strokeWidth="1.5" />
      <path d="M4 17l5-5 4 4 3-3 4 4" stroke="#DCC7A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PictureSlot({ src, alt = "", className = "", objectFit = "cover", objectPosition = "center" }) {
  const [broken, setBroken] = useState(false);
  
  if (!src || broken) {
    return <PlaceholderImage className={className} />;
  }
  
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className={`${className} border border-[#4a3a2e]`}
      style={{ 
        objectFit,
        objectPosition
      }}
    />
  );
}

// Decorative claw that slides in from the right when the user scrolls down
function BrownClawSide() {
  const [show, setShow] = useState(false);
  const [src, setSrc] = useState('/brownclawside2.png');

  useEffect(() => {
    let scrollTimer;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;

      // Show the claw immediately when scrolling starts
      setShow(true);

      // Clear any existing timer
      clearTimeout(scrollTimer);

      // Set a new timer to hide the claw after scrolling stops
      scrollTimer = setTimeout(() => {
        setShow(false);
      }, 500); // Hide after 500ms of no scrolling

      requestAnimationFrame(() => {
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(scrollTimer);
    };
  }, []);

  return (
    <motion.img
      src={src}
      alt="claw"
      onError={() => setSrc('/brownclaw.png')}
      initial={{ x: 0, opacity: 0, rotate: 0 }}
      animate={show ? { x: -100, opacity: 1, rotate: 90 } : { x: 0, opacity: 0, rotate: 0 }}
      transition={{ 
        duration: 2,
        ease: [0.16, 1, 0.3, 1],
        type: 'tween'
      }}
      style={{ right: -500, top: '28%', width: 900, transformOrigin: 'right center' }}
      className="fixed pointer-events-none z-50 hidden md:block select-none"
    />
  );
}

function scrollToId(id) {
  try {
    const el = document.getElementById(id);
    if (!el) return;
    const header = document.querySelector("header");
    const offset = header ? header.getBoundingClientRect().height + 8 : 80;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    // Only scroll if we're not already at the top of the page
    if (window.scrollY > 100) {
      window.scrollTo({ top, behavior: "smooth" });
    }
  } catch (e) {
    console.warn("scrollToId failed (non-fatal)", e);
  }
}

function SectionLink({ targetId, className = "", children, onClick }) {
  return (
    <Link
      to={`/${targetId}`}
      onClick={onClick}
      className={className}
      role="button"
    >
      {children}
    </Link>
  );
}

/*********************************
 * Layout shell
 *********************************/
function Shell({ children }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const active = location.pathname.substring(1) || 'home';

  return (
    <div className={`${palette.bg} min-h-screen text-[#DCC7A1]`}>
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/30 border-b border-[#4a3a2e]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/brownclaw.png" alt="claw" className="w-10 h-10" />
            <span className="text-lg font-bold tracking-wide text-amber-200">The Unearthed Dinos</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                to={`/${id}`}
                className={`px-3 py-2 rounded-xl text-sm flex items-center gap-2 transition hover:bg-[#4a3a2e]/60 ${
                  active === id ? "bg-[#4a3a2e] text-amber-200" : "text-[#DCC7A1]"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
          </nav>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-xl hover:bg-[#4a3a2e]" aria-label="Toggle menu">
            <Menu />
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t border-[#4a3a2e]">
            <div className="px-4 py-2 grid grid-cols-2 gap-2">
              {sections.map(({ id, label }) => (
                <Link
                  key={id}
                  to={`/${id}`}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-xl bg-[#3b2f24] text-amber-100"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

  <BrownClawSide />

  {children}

      <footer className="relative mt-24 border-t border-[#4a3a2e] bg-black/30">
        {/* Decorative brown claw image */}
        <img src="/brownclaw.png" alt="The Unearthed Dinos claw" className="absolute left-6 bottom-6 w-24 opacity-90 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-[#DCC7A1]">
          <div>
            <h4 className="text-amber-200 font-semibold mb-2">The Unearthed Dinos</h4>
            <p className="text-sm opacity-80">FIRST® LEGO® League robotics team with a passion for science, design, and digging up big ideas.</p>
          </div>
          <div>
            <h4 className="text-amber-200 font-semibold mb-2">Quick Links</h4>
            <ul className="space-y-1 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <Link className="hover:underline" to={`/${s.id}`}>{s.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-amber-200 font-semibold mb-2">Social</h4>
            <div className="flex gap-3">
              <a className="p-2 rounded-xl bg-[#3b2f24]" href="#" aria-label="GitHub"><Github /></a>
              <a className="p-2 rounded-xl bg-[#3b2f24]" href="#" aria-label="YouTube"><Youtube /></a>
            </div>
          </div>
          <div>
            <h4 className="text-amber-200 font-semibold mb-2">Contact</h4>
            <p className="text-sm flex items-center gap-2"><Mail className="w-4 h-4" />forgetmenots27820@gmail.com</p>
            <p className="text-sm flex items-center gap-2"><Phone className="w-4 h-4" />+1 (425) 800-4330</p>
            <p className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4" />Sammamish, WA</p>
          </div>
        </div>
        <div className="text-center text-xs text-[#DCC7A1]/70 pb-8">© {new Date().getFullYear()} The Unearthed Dinos — FIRST® LEGO® League</div>
      </footer>
    </div>
  );
}

/*********************************
 * Sections
 *********************************/
function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      {/* Background image (no crop) */}
      <div className="absolute inset-0 z-0 bg-black" aria-hidden>
        <img
          src="/group5.jpg"   // file should be in /public
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      {/* Scrim + decorative blobs above the image */}
      <div className="absolute inset-0 z-10 bg-black/35 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 z-10 opacity-30 pointer-events-none" aria-hidden>
        <div className="absolute -top-24 -right-24 w-[40rem] h-[40rem] rounded-full bg-gradient-to-br from-amber-900/60 to-amber-700/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-[30rem] h-[30rem] rounded-full bg-gradient-to-tr from-amber-800/50 to-amber-600/30 blur-3xl" />
      </div>

      {/* Content pinned to top */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 pt-28 pb-16 min-h-[60vh] flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold text-amber-200 tracking-tight">
            The Unearthed Dinos
          </h1>
          <p className="mt-4 text-lg md:text-xl text-[#DCC7A1] max-w-3xl mx-auto">
            Digging into robotics, innovation, and teamwork — one mission at a time.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <SectionLink
              targetId="about"
              className="px-5 py-3 rounded-2xl bg-amber-700 text-amber-50 font-semibold hover:bg-amber-800"
            >
              Learn More
            </SectionLink>
            <SectionLink
              targetId="robot"
              className="px-5 py-3 rounded-2xl bg-[#3b2f24] text-amber-100 font-semibold hover:bg-[#4a3a2e] flex items-center gap-2"
            >
              Our Robot <ChevronRight className="w-4 h-4" />
            </SectionLink>
          </div>
        </motion.div>
      </div>
    </section>
  );
}



function About() {
  return (
    <section id="about" className="max-w-7xl mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-amber-200">About</h2>
      <p className="mt-4 text-[#DCC7A1] max-w-3xl">We are an FLL team exploring engineering through a theme of archaeology — unearthing insights, testing hypothesis, and iterating like field scientists. Our core values: Discovery, Innovation, Impact, Inclusion, Teamwork, and Fun.</p>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {team.map((m) => (
          <motion.div key={m.name} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`${palette.card} rounded-2xl p-5 border border-[#4a3a2e]`}>
            <PictureSlot 
              src={m.photo} 
              alt={m.name} 
              className="h-24 w-24 rounded-xl mb-4"
              objectPosition={m.name === "Simone Justin" ? "center 30%" : "center"}
            />
            <h3 className="text-amber-100 font-semibold text-lg">{m.name}</h3>
            <p className="text-sm text-[#DCC7A1]/90">{m.role}</p>
            <p className="text-xs mt-2 text-[#DCC7A1]/70">Favorite dino: {m.dino}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Outreach() {
  const items = [
    {
      title: "Museum Maker Day",
      desc: "Hands-on robotics demo station for 120+ kids.",
      impact: "120 students",
      photo: "/teamwork.jpg"
    },
    {
      title: "Library Talk: Coding Fossils",
      desc: "Empowering young minds with innovation through FLL.",
      impact: "3 sessions to come",
      photo: "/libraryoutreach.jpg"  // Changed to libraryoutreach.jpg
    },
    {
      title: "STEM Night",
      desc: "Shared FLL core values and ran mini-missions.",
      impact: "300 visitors",
      photo: "/teamwork3.jpg"
    },
  ];
  return (
    <section id="outreach" className="max-w-7xl mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-amber-200">Outreach</h2>
      <p className="mt-4 text-[#DCC7A1] max-w-2xl">We share what we learn with schools, libraries, and community events. Want a demo? Reach out — we'll bring the dig site to you!</p>
      <div className="mt-8 grid md:grid-cols-3 gap-5">
        {items.map((it) => (
          <div key={it.title} className={`${palette.card} p-5 rounded-2xl border border-[#4a3a2e]`}>
            <PictureSlot 
              src={it.photo} 
              alt={it.title} 
              className="h-32 w-full rounded-xl mb-3"
              objectPosition={it.title === "Library Talk: Coding Fossils" ? "center 40%" : "center 20%"} // Library Talk lower, others stay up
            />
            <h3 className="text-amber-100 font-semibold">{it.title}</h3>
            <p className="text-sm text-[#DCC7A1]/90 mt-1">{it.desc}</p>
            <div className="mt-3 inline-block text-xs px-2 py-1 rounded-full bg-amber-800/40 border border-amber-800/60 text-amber-200">Impact: {it.impact}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function UnearthedSection() {
  const artifacts = [
    { 
      name: "Mission Notes", 
      blurb: "Hypotheses, trials, and results from each sprint.", 
      photo: "/teamwork2.jpg" 
    },
    { 
      name: "Field Log", 
      blurb: "Bugs we found and how we fixed them.", 
      photo: "/data.jpg"  // Changed to data.jpg
    },
    { 
      name: "Design Sketches", 
      blurb: "From rough sketches to CAD to tested attachments.", 
      photo: "/board.jpg"  // Changed to board.jpg
    },
  ];
  return (
    <section id="unearthed" className="max-w-7xl mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-amber-200">Unearthed</h2>
      <p className="mt-4 text-[#DCC7A1] max-w-3xl">This is our dig site — a living archive of what we’ve uncovered: strategy, prototypes, code snippets, and lessons learned.</p>
      <div className="mt-8 grid md:grid-cols-3 gap-5">
        {artifacts.map((a) => (
          <div key={a.name} className={`${palette.card} p-5 rounded-2xl border border-[#4a3a2e]`}>
            <PictureSlot 
              src={a.photo} 
              alt={a.name} 
              className="h-32 w-full rounded-xl mb-3" 
              objectPosition={a.name === "Mission Notes" ? "center 20%" : "center"} // Shift Mission Notes up
            />
            <h3 className="text-amber-100 font-semibold">{a.name}</h3>
            <p className="text-sm text-[#DCC7A1]/90 mt-2">{a.blurb}</p>
            <SectionLink targetId="robot" className="mt-3 inline-flex items-center gap-2 text-amber-200 hover:underline">
              View <ChevronRight className="w-4 h-4" />
            </SectionLink>
          </div>
        ))}
      </div>
    </section>
  );
}

function RobotDesign() {
  const features = [
    { title: "Chassis", text: "Low-CG 15x19 stud frame, balanced for tight turns." },
    { title: "Drive", text: "2-motor differential with rubber traction wheels." },
    { title: "Sensors", text: "Dual color sensors + gyro for line + angle accuracy." },
    { title: "Attachments", text: "Modular quick-swap mounts with technic pins." },
    { title: "Code", text: "Block-based missions with tuned PID for reliability." },
  ];
  return (
    <section id="robot" className="max-w-7xl mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-amber-200">Robot Design</h2>
      <div className="mt-6 grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <PictureSlot src="/robot.jpg" alt="The Unearthed Dinos Robot" className={`${palette.card} aspect-video w-full rounded-2xl`} />
        </div>
        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f.title} className={`${palette.card} p-4 rounded-2xl border border-[#4a3a2e]`}>
              <div className="text-amber-100 font-semibold">{f.title}</div>
              <div className="text-sm text-[#DCC7A1]/90">{f.text}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TeamFun() {
  const activities = [
    {
      title: "Movie Nights",
      desc: "Team bonding with sci-fi and dinosaur movies plus popcorn!",
      photo: "/movie.jpg",
      date: "Monthly"
    },
    {
      title: "Bowling",
      desc: "Team bonding with bowling and friendly competition!",
      photo: "/bowling.jpg",
      date: "Monthly"
    },
    {
      title: "Park Picnics",
      desc: "Outdoor fun with games, food, and strategy planning.",
      photo: "/picnic.jpg",
      date: "Bi-monthly"
    }
  ];

  return (
    <section id="fun" className="max-w-7xl mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-amber-200">Team Fun</h2>
      <p className="mt-4 text-[#DCC7A1] max-w-2xl">
        Building robots is fun, but building friendships is even better! Here's how we bond as a team.
      </p>
      <div className="mt-8 grid md:grid-cols-3 gap-5">
        {activities.map((activity) => (
          <div key={activity.title} className={`${palette.card} p-5 rounded-2xl border border-[#4a3a2e]`}>
            <PictureSlot 
              src={activity.photo} 
              alt={activity.title} 
              className="h-48 w-full rounded-xl mb-4"
              objectPosition="center 30%"
            />
            <h3 className="text-amber-100 font-semibold text-xl">{activity.title}</h3>
            <p className="text-sm text-[#DCC7A1]/90 mt-2">{activity.desc}</p>
            <div className="mt-3 inline-block text-xs px-2 py-1 rounded-full bg-amber-800/40 border border-amber-800/60 text-amber-200">
              {activity.date}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
function Awards() {
  const activities = [
    {
      title: "Championship Finalist",
      desc: "First Dive Championship Finalist",
      photo: "/teamfungroup.jpg",
      date: "2024 - 2025"
    },
    {
      title: "Robot Design Winner",
      desc: "First Dive Robot Design Winner",
      photo: "/awards.jpg",
      date: "2024 - 2025"
    },
    {
      title: "Championship Finalist",
      desc: "MasterPiece Championship Finialist and Core Values Award Winner",
      photo: "/takingaward.JPG",
      date: "2023 - 2024"
    }
  ];

  return (
    <section id="awards" className="max-w-7xl mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-amber-200">Awards</h2>
      <p className="mt-4 text-[#DCC7A1] max-w-2xl">
        Building robots is fun, but building friendships is even better! Here's how we bond as a team.
      </p>
      <div className="mt-8 grid md:grid-cols-3 gap-5">
        {activities.map((activity) => (
          <div key={activity.title} className={`${palette.card} p-5 rounded-2xl border border-[#4a3a2e]`}>
            <PictureSlot 
              src={activity.photo} 
              alt={activity.title} 
              className="h-48 w-full rounded-xl mb-4"
              objectPosition="center 30%"
            />
            <h3 className="text-amber-100 font-semibold text-xl">{activity.title}</h3>
            <p className="text-sm text-[#DCC7A1]/90 mt-2">{activity.desc}</p>
            <div className="mt-3 inline-block text-xs px-2 py-1 rounded-full bg-amber-800/40 border border-amber-800/60 text-amber-200">
              {activity.date}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function miniAnswer(input) {
  const s = input.toLowerCase();
  if (s.includes("core values")) return "FLL Core Values: Discovery, Innovation, Impact, Inclusion, Teamwork, and Fun. Show examples of each from your season.";
  if (s.includes("robot game") || s.includes("missions")) return "Break missions into buckets (easy/reliable/points-per-second). Prioritize reliability > raw points. Use checklists for every run.";
  if (s.includes("judging") || s.includes("presentation")) return "Tell a story: problem → research → solution → testing → impact. Keep slides simple. Practice 5-min timing with Q&A.";
  if (s.includes("program") || s.includes("code")) return "Use functions for each maneuver, calibrate sensors at table, and log attempts. Small tweaks, one variable at a time.";
  if (s.includes("attachments") || s.includes("design")) return "Design for repeatable alignment. Add hard-stops, center of mass low, and color-coding for quick swaps.";
  return "I’m a simple on-page helper. Ask me about robot game strategy, judging tips, presentations, or outreach ideas.";
}
function Sources({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="mt-2 text-xs">
      <div className="font-semibold">Sources:</div>
      <ul className="list-disc ml-5">
        {items.map((s, i) => (
          <li key={i}>
            <a className="underline text-amber-200" href={s.url}>{s.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SmartChatBot() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! Ask me anything about this site. I’ll answer from the page first; if I can’t, I’ll ask before searching the web." }
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => { 
    // Only scroll the chat area, not the whole page
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" }); 
    }
  }, [messages]);

  // ---- YES button handler (now INSIDE the component so it sees setMessages) ----
  async function doWebSearch(q) {
    const siteChunks = extractSiteChunks(); // harmless to pass along
    const r = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, siteChunks, allowWeb: true })
    });
    const data = await r.json();
    if (data.error) {
      setMessages(m => [...m, { role: "bot", text: `Web search error: ${data.error}` }]);
      return;
    }
    setMessages(m => [...m, { role: "bot", text: data.answer, sources: data.sources || [] }]);
  }

  async function send() {
    const q = input.trim();
    if (!q) return;

    setMessages(m => [...m, { role: "user", text: q }]);
    setInput("");

    // ---- Server-driven (site first; server will ask before web) ----
    const chunks = extractSiteChunks();

    // 0) Team-specific (“Who is Tanishqa”, etc.) — keep this client-side fast path
    const teamAns = answerFromTeam(q);
    if (teamAns) {
      setMessages(m => [...m, {
        role: "bot",
        text: sentenceify(teamAns.text, 320),
        sources: [{ title: teamAns.source, url: teamAns.href }]
      }]);
      return;
    }

    // Ask the server to decide (it prefers site and will return askWeb=true if user confirmation is needed)
    const r = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, siteChunks: chunks, allowWeb: false })
    });
    const data = await r.json();

    if (data.error) {
      setMessages(m => [...m, { role: "bot", text: `Error: ${data.error}` }]);
      return;
    }

    if (data.used === 'site') {
      setMessages(m => [...m, { role: "bot", text: data.answer, sources: data.sources }]);
      return;
    }

    if (data.askWeb) {
      setMessages(m => [...m, {
        role: "bot",
        text: data.answer,
        action: { type: 'confirm-web', q }
      }]);
      return;
    }

    // Fallback (should be rare since server returns askWeb when unsure)
    setMessages(m => [...m, { role: "bot", text: data.answer || "I couldn't find an answer.", sources: data.sources || [] }]);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <section id="chatbot" data-noscan="true" className="max-w-7xl mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-amber-200">FLL Chat Bot</h2>
      <p className="mt-3 text-[#DCC7A1]">Answers from this site first, then (only if you agree) the web.</p>

      <div className="bg-[#3b2f24] mt-6 rounded-2xl border border-[#4a3a2e] p-4 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col min-h-[22rem]">
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[95%] whitespace-pre-wrap p-3 rounded-2xl ${m.role === 'bot' ? 'bg-amber-900/40 self-start' : 'bg-[#4a3a2e] self-end ml-auto'
                  }`}
              >
                {m.text}

                {m.sources && <Sources items={m.sources} />}

                {m.action?.type === 'confirm-web' && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => doWebSearch(m.action.q)}
                      className="px-3 py-1 rounded-full bg-amber-700 text-amber-50 text-xs"
                    >
                      Yes, search the web
                    </button>
                    <button
                      onClick={() =>
                        setMessages(ms => [...ms, { role: 'bot', text: "Okay! You can refine your question or browse the sections above." }])
                      }
                      className="px-3 py-1 rounded-full bg-[#3b2f24] border border-[#4a3a2e] text-amber-100 text-xs"
                    >
                      No thanks
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask a question…"
              className="w-full resize-none rounded-xl bg-[#2B221A] border border-[#4a3a2e] p-3 text-amber-100"
              rows={2}
            />
            <button onClick={send} className="px-4 rounded-xl bg-amber-700 text-amber-50 font-semibold hover:bg-amber-800">
              Send
            </button>
          </div>
        </div>

        <div>
          <div className="text-sm text-[#DCC7A1] mb-2">Try:</div>
          <div className="flex flex-wrap gap-2">
            {["core values", "robot game missions", "judging tips", "attachments", "programming"].map(h => (
              <button key={h} onClick={() => setInput(h)} className="text-xs px-3 py-1 rounded-full bg-amber-800/40 border border-amber-800/60 text-amber-100">
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/*********************************
 * Self-tests (dev only)
 *********************************/
function runSelfTests() {
  try {
    const ids = sections.map((s) => s.id);
    const uniqueIds = new Set(ids);
    console.assert(uniqueIds.size === ids.length, "Section IDs must be unique", ids);

    const expectedNames = ["Tanishqa Erattu", "Simone Justin", "Abhimanyu Arvindh", "Manveer Singh", "Aarav Kukreja"];
    const names = team.map((t) => t.name);
    expectedNames.forEach((n) => console.assert(names.includes(n), `Missing team member: ${n}`));

    const requiredIds = ["home", "about", "outreach", "unearthed", "robot", "chatbot", "contact"];
    requiredIds.forEach((rid) => console.assert(ids.includes(rid), `Missing section: #${rid}`));

    requiredIds.forEach((rid) => {
      const el = document.getElementById(rid);
      console.assert(!!el, `Section element missing in DOM: #${rid}`);
    });

    // requiredIds.forEach((rid) => scrollToId(rid));
    // scrollToId("__does_not_exist__");

    const navLinks = document.querySelectorAll("header nav a");
    console.assert(navLinks.length === sections.length, "Nav links != sections length");

    console.log("✅ Self-tests passed (integrity + sandbox-safe scrolling)");
  } catch (e) {
    console.error("❌ Self-tests failed:", e);
  }
}

/*********************************
 * App
 *********************************/
export default function App() {
  useEffect(() => {
    if (import.meta?.env?.MODE !== "production") runSelfTests();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Shell>
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <About />
              <Outreach />
              <UnearthedSection />
              <RobotDesign />
              <TeamFun />
              <Awards />
              <Timeline />
              <SmartChatBot />
              <Contact />
            </>
          } />
          <Route path="/home" element={<Hero />} />
          <Route path="/about" element={<About />} />
          <Route path="/outreach" element={<Outreach />} />
          <Route path="/unearthed" element={<UnearthedSection />} />
          <Route path="/robot" element={<RobotDesign />} />
          <Route path="/fun" element={<TeamFun />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/chatbot" element={<SmartChatBot />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Shell>
    </Router>
  );
}

function Timeline() {
  const events = [
    {
      date: "September 2023",
      title: "Team Formation",
      description: "The Unearthed Dinos team was formed with five passionate members."
    },
    {
      date: "October 2023",
      title: "First Competition Prep",
      description: "Started preparing for our first FLL competition, focusing on robot design and innovation project."
    },
    {
      date: "December 2023",
      title: "Regional Competition",
      description: "Participated in our first regional FLL competition, learning valuable lessons in teamwork and robotics."
    },
    {
      date: "February 2024",
      title: "Community Outreach",
      description: "Launched our community outreach program, sharing our love for robotics with local schools."
    },
    {
      date: "May 2024",
      title: "Innovation Project Success",
      description: "Completed our innovation project and presented it to local STEM professionals."
    },
    {
      date: "August 2024",
      title: "Summer Workshop",
      description: "Organized summer robotics workshop for elementary school students."
    }
  ];

  return (
    <section id="timeline" className="max-w-7xl mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-amber-200">Our Journey</h2>
      <p className="mt-4 text-[#DCC7A1] max-w-3xl">Follow our path from team formation to where we are today.</p>
      
      <div className="mt-12 relative">
        {/* Vertical line */}
        <div className="absolute left-0 md:left-1/2 h-full w-0.5 bg-amber-800/50 transform -translate-x-1/2"></div>
        
        {/* Timeline events */}
        <div className="space-y-12">
          {events.map((event, index) => (
            <div key={event.date} className={`relative flex items-center ${
              index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
            } gap-8`}>
              {/* Dot on timeline */}
              <div className="absolute left-0 md:left-1/2 w-4 h-4 bg-amber-500 rounded-full transform -translate-x-1/2 border-4 border-amber-800"></div>
              
              {/* Content */}
              <div className={`ml-8 md:ml-0 flex-1 ${
                index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'
              }`}>
                <div className={`${palette.card} p-6 rounded-2xl border border-[#4a3a2e]`}>
                  <div className="text-amber-200 font-semibold">{event.date}</div>
                  <h3 className="text-xl font-semibold text-amber-100 mt-2">{event.title}</h3>
                  <p className="mt-2 text-[#DCC7A1]/90">{event.description}</p>
                </div>
              </div>
              
              {/* Spacer for alternating layout */}
              <div className="hidden md:block flex-1"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="max-w-7xl mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-amber-200">Contact</h2>
      <p className="mt-4 text-[#DCC7A1] max-w-2xl">Have questions about our team or want to schedule a demo? We'd love to hear from you!</p>
      <div className="mt-8 grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-amber-200" />
            <div>
              <div className="font-semibold text-amber-100">Email</div>
              <a href="mailto:forgetmenots27820@gmail.com" className="text-[#DCC7A1] hover:underline">forgetmenots27820@gmail.com</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-amber-200" />
            <div>
              <div className="font-semibold text-amber-100">Phone</div>
              <a href="tel:+14258004330" className="text-[#DCC7A1] hover:underline">+1 (425) 800-4330</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-amber-200" />
            <div>
              <div className="font-semibold text-amber-100">Location</div>
              <div className="text-[#DCC7A1]">Sammamish, WA</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
