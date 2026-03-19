import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const MAX_OTHER_MEMBERS = 3;
const YEAR_OPTIONS = ["1st", "2nd", "3rd", "4th"];
const DOMAIN_OPTIONS = ["Web / Mobile", "AI / ML", "Hardware / IoT", "Social Impact", "Other"];

const GFORM_BASE = "https://docs.google.com/forms/d/e/1FAIpQLSdGXUgo5qR7C3mvHb8K7yGRWiwzBLh8Rd2B6onzgDnDKsWT4Q/viewform";

function buildFormURL(teamName, ideaTitle, leaderName) {
  const p = new URLSearchParams({
    "entry.2005620554": teamName,
    "entry.1045781291": ideaTitle,
    "entry.1065046570": leaderName,
  });
  return ${GFORM_BASE}?usp=pp_url&${p.toString()};
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Sora:wght@300;400;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --accent:#00d3ff; --accent-2:#1db0ff; --muted:#7aa6bf; }
  html,body { height:100%; }
  body { font-family:'Sora',sans-serif; background:linear-gradient(180deg,#031726 0%,#071827 100%); color:#cfeaf5; min-height:100vh; }

  /* ── Hero ── */
  .hero { padding:80px 20px 140px; text-align:center; position:relative; overflow:hidden; }
  .hero::before { content:""; position:absolute; inset:0; pointer-events:none; z-index:0;
    background: radial-gradient(circle at 50% 28%,rgba(255,255,255,0.10),rgba(255,255,255,0.02) 25%,transparent 40%),
                radial-gradient(circle at 20% 70%,rgba(255,255,255,0.04),transparent 15%);
    opacity:0; transition:opacity 0.6s ease; }
  .hero.loaded::before { opacity:1; animation:bgPulse 6s ease-in-out infinite; }
  @keyframes bgPulse { 0%{transform:scale(1);opacity:0.55} 50%{transform:scale(1.04);opacity:0.95} 100%{transform:scale(1);opacity:0.55} }
  .hero-inner { position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; gap:4px; }

  .subtitle { font-size:13px; letter-spacing:3px; text-transform:uppercase; color:var(--muted); font-weight:600;
    opacity:0; transform:translateY(12px); transition:all 0.6s ease 0.1s; }
  .hero.loaded .subtitle { opacity:1; transform:translateY(0); }

  .title-outline { font-family:'Orbitron',monospace; font-size:clamp(64px,14vw,140px); letter-spacing:10px;
    color:transparent; -webkit-text-stroke:6px rgba(255,255,255,0.18); line-height:1; margin:8px 0 0; }
  .hero.loaded .title-outline { color:#fff; -webkit-text-stroke:0px transparent; animation:whitePop 1.2s cubic-bezier(.2,.9,.3,1) 1 forwards; }
  @keyframes whitePop {
    0%  { opacity:0; filter:blur(2px); text-shadow:0 0 0 rgba(255,255,255,0); }
    50% { opacity:1; filter:blur(0);   text-shadow:0 18px 60px rgba(255,255,255,0.28),0 6px 22px rgba(255,255,255,0.18); }
    100%{ opacity:1; filter:blur(0);   text-shadow:0 30px 120px rgba(255,255,255,0.30),0 12px 40px rgba(255,255,255,0.22); }
  }

  .year { font-family:'Orbitron',monospace; font-size:clamp(40px,8vw,90px); color:var(--accent-2);
    text-shadow:0 8px 30px rgba(29,176,255,0.25); margin:8px 0 24px;
    opacity:0; transition:opacity 0.6s ease 0.4s; }
  .hero.loaded .year { opacity:1; }

  .cta { background:linear-gradient(90deg,var(--accent),var(--accent-2)); border:none; padding:14px 32px;
    border-radius:40px; color:#fff; font-family:'Sora',sans-serif; font-weight:700; font-size:15px; cursor:pointer;
    box-shadow:0 12px 40px rgba(29,176,255,0.28); opacity:0; transition:opacity 0.6s ease 0.6s,transform 0.18s,box-shadow 0.18s; }
  .hero.loaded .cta { opacity:1; }
  .cta:hover { transform:translateY(-2px); box-shadow:0 18px 54px rgba(29,176,255,0.38); }

  /* ── About Section ── */
  .about-section { max-width:900px; margin:0 auto 20px; padding:0 20px; }

  .about-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:20px; }

  .about-stat { background:linear-gradient(180deg,rgba(10,24,34,0.96),rgba(6,14,23,0.96));
    border-radius:20px; padding:22px 20px; border:1px solid rgba(255,255,255,0.04);
    box-shadow:0 8px 30px rgba(2,8,14,0.6); text-align:center; }
  .about-stat-icon { font-size:26px; margin-bottom:10px; }
  .about-stat-value { font-family:'Orbitron',monospace; font-size:clamp(13px,2vw,16px);
    font-weight:700; color:#fff; margin-bottom:4px; line-height:1.3; }
  .about-stat-label { font-size:11px; color:var(--muted); letter-spacing:1.5px; text-transform:uppercase; }

  .about-desc { background:linear-gradient(180deg,rgba(10,24,34,0.96),rgba(6,14,23,0.96));
    border-radius:20px; padding:24px 28px; border:1px solid rgba(255,255,255,0.04);
    box-shadow:0 8px 30px rgba(2,8,14,0.6); margin-top:14px; }
  .about-desc p { font-size:14px; line-height:1.85; color:#9fd8e8; }
  .about-desc p + p { margin-top:12px; }

  .deadline-badge { display:inline-flex; align-items:center; gap:8px;
    background:linear-gradient(90deg,rgba(255,100,80,0.12),rgba(255,60,60,0.06));
    border:1px solid rgba(255,100,80,0.25); border-radius:40px; padding:8px 18px;
    margin-top:18px; font-size:13px; font-weight:700; color:#ff8a7a; }
  .deadline-dot { width:7px; height:7px; border-radius:50%; background:#ff5a5a;
    animation:blink 1.4s ease-in-out infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* ── Register Section ── */
  .register-section { max-width:900px; margin:0 auto; padding:0 20px 100px; }
  .section-title { text-align:center; font-family:'Orbitron',monospace; font-size:clamp(28px,5vw,46px); margin:0 0 28px; font-weight:700; }
  .section-title .accent { color:var(--accent-2); }

  .card { background:linear-gradient(180deg,rgba(10,24,34,0.96),rgba(6,14,23,0.96)); border-radius:24px; padding:28px;
    margin:20px 0; border:1px solid rgba(255,255,255,0.04); box-shadow:0 8px 30px rgba(2,8,14,0.6); }
  .card-legend { font-weight:700; color:var(--muted); font-size:11px; letter-spacing:2px; text-transform:uppercase;
    margin-bottom:18px; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.05); }

  .form-group { display:flex; flex-direction:column; gap:4px; margin:14px 0; }
  .form-label { color:#9fd8e8; font-size:13px; font-weight:600; }
  .form-input,.form-select,.form-textarea { display:block; width:100%; padding:13px 16px; border-radius:12px;
    border:1px solid rgba(255,255,255,0.06); background:rgba(6,14,20,0.55); color:#e6fbff;
    font-family:'Sora',sans-serif; font-size:14px; box-shadow:inset 0 2px 8px rgba(0,0,0,0.45);
    transition:border-color 0.2s,box-shadow 0.2s; outline:none; }
  .form-input:focus,.form-select:focus,.form-textarea:focus {
    border-color:rgba(29,176,255,0.35); box-shadow:inset 0 2px 8px rgba(0,0,0,0.45),0 0 0 3px rgba(29,176,255,0.08); }
  .form-textarea { resize:vertical; }
  .two-cols { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

  /* ── Members ── */
  .members-header { display:flex; justify-content:space-between; align-items:center; margin:18px 0 10px; }
  .members-label { font-weight:600; color:#cfeaf5; font-size:14px; }
  .members-controls { display:flex; align-items:center; gap:10px; }
  .member-info { color:#bfefff; font-weight:700; font-size:13px; }
  .btn-small { background:none; border:1px solid rgba(29,176,255,0.25); color:var(--accent-2); padding:7px 14px;
    border-radius:8px; cursor:pointer; font-family:'Sora',sans-serif; font-size:13px; font-weight:600;
    transition:border-color 0.2s,background 0.2s; }
  .btn-small:hover:not(:disabled) { background:rgba(29,176,255,0.08); border-color:var(--accent-2); }
  .btn-small:disabled { opacity:0.45; cursor:not-allowed; }

  .member-row { display:grid; grid-template-columns:1fr 1fr 120px 36px; gap:10px; align-items:center; padding:12px;
    border-radius:16px; border:1px dashed rgba(29,176,255,0.07);
    background:linear-gradient(180deg,rgba(6,12,20,0.48),rgba(8,16,26,0.48)); margin-bottom:10px;
    animation:fadeInRow 0.25s ease; }
  @keyframes fadeInRow { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

  .btn-remove { background:#ff5a5a; border:none; color:#fff; border-radius:8px; cursor:pointer; padding:7px;
    font-size:13px; font-weight:700; transition:background 0.2s,opacity 0.2s;
    display:flex; align-items:center; justify-content:center; }
  .btn-remove:hover:not(:disabled) { background:#ff3333; }
  .btn-remove:disabled { opacity:0.25; cursor:not-allowed; background:#ff5a5a; }

  .member-hint { font-size:11px; color:#5a8fa8; margin-top:6px; }

  /* ── Actions ── */
  .form-actions { text-align:center; margin:32px 0 0; }
  .btn-submit { background:linear-gradient(90deg,var(--accent),#3fb1ff); padding:18px 48px; border-radius:28px;
    border:none; color:#fff; font-family:'Orbitron',monospace; font-weight:700; font-size:14px; letter-spacing:1px;
    cursor:pointer; box-shadow:0 22px 80px rgba(29,176,255,0.22); transition:transform 0.18s,box-shadow 0.18s,opacity 0.18s; }
  .btn-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 28px 90px rgba(29,176,255,0.35); }
  .btn-submit:disabled { opacity:0.6; cursor:not-allowed; }

  /* ── Toast ── */
  .toast { position:fixed; bottom:32px; left:50%; transform:translateX(-50%) translateY(20px);
    background:rgba(10,30,50,0.95); border:1px solid rgba(29,176,255,0.3); border-radius:16px;
    padding:16px 28px; color:#bfefff; font-size:14px; z-index:999; opacity:0;
    transition:opacity 0.3s,transform 0.3s; backdrop-filter:blur(8px); max-width:480px; text-align:center; }
  .toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
  .toast.success { border-color:rgba(0,211,100,0.4); }
  .toast.error { border-color:rgba(255,80,80,0.4); color:#ffbfbf; }

  /* ── Modal ── */
  .modal-backdrop { position:fixed; inset:0; background:rgba(2,8,18,0.82); backdrop-filter:blur(6px);
    z-index:200; display:flex; align-items:center; justify-content:center; padding:20px;
    animation:fadeIn 0.25s ease; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  .modal { background:linear-gradient(160deg,#081a2a,#04101c); border:1px solid rgba(29,176,255,0.18);
    border-radius:28px; padding:36px 32px 32px; max-width:500px; width:100%;
    box-shadow:0 32px 100px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.03);
    animation:slideUp 0.3s cubic-bezier(.2,.9,.3,1); }
  @keyframes slideUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }

  .modal-icon { font-size:48px; text-align:center; margin-bottom:16px; }
  .modal-title { font-family:'Orbitron',monospace; font-size:22px; font-weight:700; text-align:center;
    color:#fff; margin-bottom:8px; }
  .modal-sub { color:var(--muted); font-size:13px; text-align:center; line-height:1.6; margin-bottom:24px; }
  .modal-sub strong { color:#bfefff; }

  .modal-info { background:rgba(29,176,255,0.05); border:1px solid rgba(29,176,255,0.12);
    border-radius:14px; padding:14px 18px; margin-bottom:24px; }
  .modal-info-row { display:flex; justify-content:space-between; align-items:center;
    font-size:13px; padding:4px 0; }
  .modal-info-row span:first-child { color:var(--muted); }
  .modal-info-row span:last-child { color:#bfefff; font-weight:600; }

  .modal-note { font-size:12px; color:#5a8fa8; text-align:center; margin-bottom:22px; line-height:1.5; }

  .modal-actions { display:flex; gap:12px; }
  .btn-modal-primary { flex:1; background:linear-gradient(90deg,var(--accent),var(--accent-2));
    border:none; padding:14px 20px; border-radius:14px; color:#fff; font-family:'Sora',sans-serif;
    font-weight:700; font-size:14px; cursor:pointer; transition:transform 0.18s,box-shadow 0.18s;
    box-shadow:0 10px 36px rgba(29,176,255,0.25); text-decoration:none; display:flex;
    align-items:center; justify-content:center; gap:8px; }
  .btn-modal-primary:hover { transform:translateY(-2px); box-shadow:0 16px 48px rgba(29,176,255,0.38); }
  .btn-modal-secondary { background:none; border:1px solid rgba(255,255,255,0.08); padding:14px 20px;
    border-radius:14px; color:var(--muted); font-family:'Sora',sans-serif; font-weight:600;
    font-size:13px; cursor:pointer; transition:border-color 0.2s,color 0.2s; white-space:nowrap; }
  .btn-modal-secondary:hover { border-color:rgba(255,255,255,0.2); color:#cfeaf5; }

  /* ── Responsive ── */
  @media(max-width:700px) {
    .two-cols{grid-template-columns:1fr}
    .about-grid{grid-template-columns:1fr}
    .member-row{grid-template-columns:1fr 1fr}
    .modal-actions{flex-direction:column}
  }
  @media(max-width:480px){ .member-row{grid-template-columns:1fr} }
`;

const emptyMember = () => ({ id: Date.now() + Math.random(), name: "", dept: "", year: "" });

function MemberRow({ member, onUpdate, onRemove, canRemove }) {
  return (
    <div className="member-row">
      <input className="form-input" placeholder="Member name" value={member.name}
        onChange={e => onUpdate({ ...member, name: e.target.value })} />
      <input className="form-input" placeholder="Department" value={member.dept}
        onChange={e => onUpdate({ ...member, dept: e.target.value })} />
      <select className="form-select" value={member.year}
        onChange={e => onUpdate({ ...member, year: e.target.value })}>
        <option value="">Year</option>
        {YEAR_OPTIONS.map(y => <option key={y}>{y}</option>)}
      </select>
      <button
        type="button"
        className="btn-remove"
        onClick={onRemove}
        disabled={!canRemove}
        title={canRemove ? "Remove member" : "Minimum 2 members required"}
      >✕</button>
    </div>
  );
}

function SuccessModal({ teamName, ideaTitle, leaderName, onClose }) {
  const formURL = buildFormURL(teamName, ideaTitle, leaderName);
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-icon">🎉</div>
        <div className="modal-title">Registration Saved!</div>
        <div className="modal-sub">
          Your team details are confirmed. Now upload your files via the form below —
          fields are already <strong>pre-filled</strong> for you.
        </div>
        <div className="modal-info">
          <div className="modal-info-row"><span>Team</span><span>{teamName}</span></div>
          <div className="modal-info-row"><span>Leader</span><span>{leaderName}</span></div>
          <div className="modal-info-row"><span>Idea</span><span>{ideaTitle}</span></div>
        </div>
        <div className="modal-note">
          📎 Upload your Pitch Deck and Wadwani Foundation Certificate in the Google Form.
          The link opens with your details pre-filled — just attach the files and submit.
        </div>
        <div className="modal-actions">
          <a className="btn-modal-primary" href={formURL} target="_blank" rel="noreferrer">
            <span>📤</span> Upload Files
          </a>
          <button className="btn-modal-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [members, setMembers] = useState([emptyMember(), emptyMember()]); // min 2
  const [toast, setToast] = useState({ msg: "", type: "", show: false });
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState(null);
  const registerRef = useRef(null);
  const [form, setForm] = useState({
    teamName: "", leaderName: "", leaderEmail: "",
    leaderPhone: "", leaderDept: "", year: "",
    ideaTitle: "", ideaDesc: "", domain: "",
  });

  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  };

  // members.length = other members count (not including leader)
  const isFull = members.length >= MAX_OTHER_MEMBERS;         // 4 others max
  const canRemove = members.length > 1;                        // 2 others min

  const addMember = () => {
    if (isFull) { showToast(Maximum ${MAX_OTHER_MEMBERS} other members allowed., "error"); return; }
    setMembers(m => [...m, emptyMember()]);
  };

  const updateMember = (id, updated) => setMembers(m => m.map(mb => mb.id === id ? updated : mb));
  const removeMember = (id) => {
    if (!canRemove) return;
    setMembers(m => m.filter(mb => mb.id !== id));
  };
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = ["teamName","leaderName","leaderEmail","leaderPhone","leaderDept","year","ideaTitle","ideaDesc","domain"];
    for (const key of required) {
      if (!form[key].trim()) { showToast("Please fill all required fields.", "error"); return; }
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "registrations"), {
        ...form,
        members,
        createdAt: serverTimestamp(),
      });
      const saved = { teamName: form.teamName, ideaTitle: form.ideaTitle, leaderName: form.leaderName };
      setForm({ teamName:"",leaderName:"",leaderEmail:"",leaderPhone:"",leaderDept:"",year:"",ideaTitle:"",ideaDesc:"",domain:"" });
      setMembers([emptyMember(), emptyMember()]);
      setModal(saved);
    } catch (error) {
      showToast("Submission failed: " + error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setModal(null);
    showToast("Registration complete! Don't forget to upload your files.", "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style>{styles}</style>

      {/* ── Hero ── */}
      <header className={hero${heroLoaded ? " loaded" : ""}}>
        <div className="hero-inner">
          <div className="subtitle">AISSMS College of Engineering proudly organizes</div>
          <h1 className="title-outline">IDEATHON</h1>
          <div className="year">2026</div>
          <button className="cta"
            onClick={() => registerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            Register Now
          </button>
        </div>
      </header>

      <main>
        {/* ── About the Competition ── */}
        <section className="about-section">
          <h2 className="section-title">About the <span className="accent">Competition</span></h2>

          <div className="about-grid">
            <div className="about-stat">
              <div className="about-stat-icon">🎤</div>
              <div className="about-stat-value">Pitch + Q&amp;A</div>
              <div className="about-stat-label">Format</div>
            </div>
            <div className="about-stat">
              <div className="about-stat-icon">💡</div>
              <div className="about-stat-value">Any Domain</div>
              <div className="about-stat-label">Tech or Non-Tech</div>
            </div>
            <div className="about-stat">
              <div className="about-stat-icon">🚫</div>
              <div className="about-stat-value">No Prototype</div>
              <div className="about-stat-label">Required</div>
            </div>
          </div>

          <div className="about-desc">
            <p>
              Ideathon 2026 is a pitch-based competition where participants present their innovative ideas
              to a panel of judges through a well-structured presentation. The focus is on effectively
              communicating your idea using a compelling PPT (pitch deck) — a working prototype is
              <strong style={{color:"#bfefff"}}> not mandatory</strong>.
            </p>
            <p>
              Following each pitch, there will be a <strong style={{color:"#bfefff"}}>Q&amp;A session</strong> where
              judges evaluate the concept, feasibility, and clarity of thought. Participants are free to
              choose ideas from <strong style={{color:"#bfefff"}}>any domain</strong> — technical or
              non-technical — without restriction.
            </p>
            <div className="deadline-badge">
              <span className="deadline-dot"></span>
              Submission Deadline: 27th March 2026
            </div>
          </div>
        </section>

        {/* ── Registration Form ── */}
        <section id="register" className="register-section" ref={registerRef}>
          <h2 className="section-title">Register Your <span className="accent">Team</span></h2>

          <form onSubmit={handleSubmit} noValidate>

            {/* Team Details */}
            <div className="card">
              <div className="card-legend">Team Details</div>

              <div className="form-group">
                <label className="form-label" htmlFor="teamName">Team Name *</label>
                <input id="teamName" name="teamName" className="form-input"
                  placeholder="e.g. InnovatorsX" required value={form.teamName} onChange={handleChange} />
              </div>

              <div className="two-cols">
                <div className="form-group">
                  <label className="form-label" htmlFor="leaderName">Leader Name *</label>
                  <input id="leaderName" name="leaderName" className="form-input"
                    placeholder="Full name" required value={form.leaderName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="leaderEmail">Leader Email *</label>
                  <input id="leaderEmail" name="leaderEmail" type="email" className="form-input"
                    placeholder="email@example.com" required value={form.leaderEmail} onChange={handleChange} />
                </div>
              </div>

              <div className="two-cols">
                <div className="form-group">
                  <label className="form-label" htmlFor="leaderPhone">Leader Phone *</label>
                  <input id="leaderPhone" name="leaderPhone" className="form-input"
                    placeholder="+91 XXXXXXXXXX" value={form.leaderPhone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="leaderDept">Leader Department *</label>
                  <input id="leaderDept" name="leaderDept" className="form-input"
                    placeholder="e.g. Computer Engineering" value={form.leaderDept} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="year">Year *</label>
                <select id="year" name="year" className="form-select" value={form.year} onChange={handleChange}>
                  <option value="">Select year</option>
                  {YEAR_OPTIONS.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>

              {/* Dynamic Members */}
              <div className="members-header">
                <span className="members-label">Other Team Members</span>
                <div className="members-controls">
                  <span className="member-info">{members.length} / {MAX_OTHER_MEMBERS}</span>
                  <button type="button" className="btn-small" onClick={addMember} disabled={isFull}>
                    {isFull ? "✓ Full" : "+ Add Member"}
                  </button>
                </div>
              </div>

              {members.map(mb => (
                <MemberRow key={mb.id} member={mb}
                  canRemove={canRemove}
                  onUpdate={updated => updateMember(mb.id, updated)}
                  onRemove={() => removeMember(mb.id)} />
              ))}

              <p className="member-hint">
                Min 1 · Max {MAX_OTHER_MEMBERS} other members (Excluding leader)
              </p>
            </div>

            {/* Idea Details */}
            <div className="card">
              <div className="card-legend">Idea Details</div>
              <div className="form-group">
                <label className="form-label" htmlFor="ideaTitle">Idea Title *</label>
                <input id="ideaTitle" name="ideaTitle" className="form-input"
                  placeholder="Give your idea a compelling title" required value={form.ideaTitle} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ideaDesc">Idea Description *</label>
                <textarea id="ideaDesc" name="ideaDesc" className="form-textarea" rows={6}
                  placeholder="Briefly describe your idea, problem it solves, and target audience..."
                  required value={form.ideaDesc} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="domain">Domain *</label>
                <select id="domain" name="domain" className="form-select" value={form.domain} onChange={handleChange}>
                  <option value="">Select a domain</option>
                  {DOMAIN_OPTIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Registration"}
              </button>
            </div>
          </form>
        </section>
      </main>

      {modal && (
        <SuccessModal
          teamName={modal.teamName}
          ideaTitle={modal.ideaTitle}
          leaderName={modal.leaderName}
          onClose={closeModal}
        />
      )}

      <div className={toast ${toast.type}${toast.show ? " show" : ""}}>{toast.msg}</div>
    </>
  );
}
