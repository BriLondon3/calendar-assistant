import Link from 'next/link';
import { getCurrentUser } from './auth-client';
import SiteHeader from './components/site-header';
import ReviewDemo from './components/review-demo';
import './landing.css';

export const dynamic = 'force-dynamic';

// Hero background style (see .lp[data-bg] in landing.css).
const BACKGROUND = 'grid';

const SOURCES = ['GroupMe', 'Flare', 'iMessage', 'Email', 'Flyers', 'Instagram stories', 'Discord', 'Class announcements', 'Slack', 'Event posters'];

const CHAOS = [
  { app: 'GroupMe · Club Soccer', text: 'IM game vs Delta this Sat 4pm, field 3. be there!!', tone: 'blue' },
  { app: 'Flare', text: '✨ Fall Formal — Sat, Nov 22 · 9 PM · The Boathouse', tone: 'orange' },
  { app: 'Email · Prof. Diaz', text: 'Office hours moved: this week only, Thu 3–4pm', tone: 'white' },
  { app: 'Text · Jess', text: 'bday dinner fri 8pm @ Carmine’s, then going out after 🎂', tone: 'sky' },
  { app: 'Email · Recruiting', text: 'Coffee chat confirmed: Tue 2:30pm, Blue Bottle on Main', tone: 'white' },
];

const USE_CASES = [
  { emoji: '🪩', title: 'Your social calendar', copy: 'Darties, date parties, formals, birthday dinners, and the pregame before — with the time and address already filled in.' },
  { emoji: '🏛️', title: 'Chapter life', copy: 'Chapter, homecoming week, philanthropy events, and every “mandatory, no excuses” post from your sorority or fraternity GroupMe.' },
  { emoji: '📣', title: 'Club & org life', copy: 'GBMs, division meetings, team check-ins, and the trip sign-up that’s due Friday.' },
  { emoji: '📋', title: 'Running the show', copy: 'On exec? Exec meetings, Zooms with your advisor, and event setup at 6 — everything you’re responsible for, in one place.' },
  { emoji: '💼', title: 'Recruiting season', copy: 'Coffee chats, info sessions, and job fairs, plus application due dates collected into one all-day reminder per day, so no deadline sneaks up on you.' },
  { emoji: '📚', title: 'Class curveballs', copy: 'Rescheduled exams, review sessions, and office hours from professor emails and course announcements.' },
];

const FEATURES = [
  'Upload up to 10 screenshots at a time',
  'Pulls out the title, date, time, place, and details',
  'Review side by side with your Google Calendar',
  'Edit, skip, or add each event in one click',
  'Application deadlines grouped by day, with your reminders',
  'Remove anything you added by mistake',
  'Your review list syncs across your devices',
];

const FAQS = [
  { q: 'Can it track internship and job application deadlines?', a: 'Yes. Screenshot a posting or a recruiting email with a due date and it becomes an all-day “applications due” event. If another application is due the same day, it’s added to that same event, and the description lists each company and role. Pick when you get reminded (like a week and two days before) in your account.' },
  { q: 'How does the free trial work?', a: 'Your first 3 screenshots are free, no card needed. After that, start a 7-day free trial to keep going. You won’t be charged until the trial ends, and you can cancel any time from your account page before then. After the trial it’s $2.99 a month.' },
  { q: 'What can I screenshot?', a: 'Anything with event details on it: GroupMe and Flare posts, texts, emails, Instagram stories, flyers, and posters. As long as the name, date, and time are visible in the image, Booked and Busy can read them. PNG, JPG, and WebP images up to 3 MB each work.' },
  { q: 'Does it add things to my calendar automatically?', a: 'No — nothing lands on your calendar without your OK. Every event goes into a review list first, next to that day on your calendar, so you can fix details, skip it, or add it with one click.' },
  { q: 'What if it reads something wrong?', a: 'Tap the pencil on any event to edit the name, dates, times, location, or description before you add it. If a detail was unclear in the screenshot, the event shows extraction notes so you know what to double-check.' },
  { q: 'Which calendars does it work with?', a: 'Google Calendar today. You connect it once from your account page and choose which plans to add. More calendar apps are on the roadmap.' },
  { q: 'Is my info private?', a: 'Your screenshots are sent to Google Gemini only to read the event details. Calendar access is limited to events on calendars you own, your Google connection is encrypted (AES-256-GCM), and your review list is only visible to your account. You can disconnect Google Calendar at any time from your account page.' },
  { q: 'Do I use it on my phone or my laptop?', a: 'Both — that’s the idea. Upload screenshots from your phone, where they already are, then review them on your laptop, where your calendar is easier to see. Your review list syncs to your account, so it shows up on any device you log in on. There’s nothing to install; it runs in your browser.' },
];

function Sparks({ className }) {
  return (
    <svg className={`sparks ${className || ''}`} viewBox="0 0 60 50" aria-hidden="true">
      <path d="M8 30 L2 14" /><path d="M20 26 L32 10" /><path d="M26 38 L44 34" />
    </svg>
  );
}

export default async function Home() {
  const user = await getCurrentUser();
  const startHref = user ? '/upload' : '/signup';
  const startLabel = user ? 'Upload screenshots' : 'Get started';

  return (
    <div className="lp" data-bg={BACKGROUND}>
      <div className="lp-wrap">
        <SiteHeader user={user} variant="marketing" />
      </div>

      <main className="lp-main">
        {/* Hero */}
        <section className="lp-hero" aria-labelledby="headline">
          <div className="lp-wrap lp-hero-copy">
            <p className="lp-pill"><span aria-hidden="true">✳</span> Your plans are in 9 apps. Your calendar is in one.</p>
            <h1 id="headline">Screenshot it.<br /><em>Schedule it.<Sparks className="hero-sparks" /></em></h1>
            <p className="lp-lede">Booked and Busy turns screenshots from GroupMe, Flare, texts, emails, and flyers into calendar events. Check them against your schedule, then add the ones you want to Google Calendar in one click.</p>
            <div className="lp-cta-row">
              <Link className="primary-button lp-button-lg" href={startHref}>{startLabel} <span aria-hidden="true">→</span></Link>
              <a className="lp-ghost-button" href="#demo">Watch it work</a>
            </div>
            <p className="lp-cta-note"><strong>$2.99/month</strong> · Upload from your phone, review on your laptop · Works with Google Calendar</p>
          </div>

          <div className="lp-wrap lp-demo-wrap" id="demo">
            <ReviewDemo />
          </div>
        </section>

        {/* Works with */}
        <section className="lp-sources" aria-label="Works with screenshots from">
          <p>Works with screenshots from</p>
          <div className="lp-marquee">
            <ul>
              {[...SOURCES, ...SOURCES].map((source, index) => <li key={index} aria-hidden={index >= SOURCES.length || undefined}>{source}</li>)}
            </ul>
          </div>
        </section>

        {/* Problem */}
        <section className="lp-wrap lp-problem" aria-labelledby="problem-heading">
          <div className="lp-chaos" aria-hidden="true">
            {CHAOS.map((item, index) => (
              <div key={item.app} className={`lp-chaos-card tone-${item.tone}`} style={{ '--i': index }}>
                <span>{item.app}</span>
                <p>{item.text}</p>
              </div>
            ))}
            <span className="lp-chaos-badge">+47 unread</span>
          </div>
          <div className="lp-problem-copy">
            <p className="lp-eyebrow">Sound familiar?</p>
            <h2 id="problem-heading">The plans are made. They’re just <span className="lp-scribble">everywhere</span>.</h2>
            <ul className="lp-pains">
              <li><span aria-hidden="true">😵‍💫</span><div><strong>Scrolling back 200 messages</strong> to find what time the meeting was.</div></li>
              <li><span aria-hidden="true">⌨️</span><div><strong>Typing every event by hand</strong> — title, time, address, the whole thing.</div></li>
              <li><span aria-hidden="true">🫠</span><div><strong>Finding the conflict too late</strong>, when you’re already double-booked.</div></li>
            </ul>
            <p className="lp-problem-kicker">Your camera roll is full of plans. Your calendar should be too.</p>
          </div>
        </section>

        {/* How it works */}
        <section className="lp-how" id="how-it-works" aria-labelledby="how-heading">
          <div className="lp-wrap">
            <p className="lp-eyebrow">How it works</p>
            <h2 id="how-heading">Three steps. Zero typing.</h2>
            <ol className="lp-steps">
              <li>
                <div className="lp-step-art lp-art-upload" aria-hidden="true">
                  <div className="mini-shot mini-shot-back">
                    <p className="mini-from">👥 Chapter chat</p>
                    <p className="mini-bubble">Date party Fri 9pm!! buses leave from the house 🚌</p>
                  </div>
                  <div className="mini-shot mini-shot-front">
                    <span className="mini-corner tl" /><span className="mini-corner br" />
                    <div className="mini-invite-art" />
                    <p className="mini-invite-title">🌹 Spring Date Party</p>
                    <p className="mini-invite-meta">Fri · 9 PM · The Venue</p>
                  </div>
                  <span className="mini-pill">↑ 2 screenshots</span>
                </div>
                <span className="lp-step-num">01</span>
                <h3>Upload your screenshots</h3>
                <p>Upload up to 10 at once, right from your phone’s camera roll: group chats, invites, emails, flyers. Booked and Busy reads every event out of them.</p>
              </li>
              <li>
                <div className="lp-step-art lp-art-review" aria-hidden="true">
                  <div className="mini-card">
                    <p className="mini-card-title">Spring Date Party</p>
                    <p className="mini-card-meta"><b>Fri, Apr 10</b><br />9:00 PM – 1:00 AM</p>
                    <div className="mini-card-actions"><span className="mini-add">Add to calendar</span><span className="mini-skip">Skip</span></div>
                  </div>
                  <div className="mini-day">
                    <span className="mini-ev" style={{ top: 10, height: 30, background: '#33b679' }}>Shift</span>
                    <span className="mini-ev" style={{ top: 50, height: 26, background: '#8e24aa' }}>Lab</span>
                    <span className="mini-ev mini-ev-proposed" style={{ top: 92, height: 44 }}>Date party</span>
                  </div>
                </div>
                <span className="lp-step-num">02</span>
                <h3>Review against your calendar</h3>
                <p>Each event sits right next to that day on your Google Calendar. Spot conflicts, fix a time, or skip what you don’t need.</p>
              </li>
              <li>
                <div className="lp-step-art lp-art-add" aria-hidden="true">
                  <div className="mini-gcal">
                    <p className="mini-gcal-head"><span>FRI</span><b>10</b></p>
                    <div className="mini-gcal-grid">
                      <span className="mini-ev" style={{ top: 6, height: 28, background: '#7986cb' }}>ECON 101</span>
                      <span className="mini-ev mini-ev-added" style={{ top: 46, height: 52 }}><b>Spring Date Party</b>9 PM – 1 AM · The Venue</span>
                    </div>
                  </div>
                  <span className="mini-added">✓ Added to Google Calendar</span>
                </div>
                <span className="lp-step-num">03</span>
                <h3>Add it in one click</h3>
                <p>The event lands on Google Calendar with the title, time, location, and details already filled in. Changed your mind? Remove it just as fast.</p>
              </li>
            </ol>
          </div>
        </section>

        {/* Campus */}
        <section className="lp-wrap lp-campus" aria-labelledby="campus-heading">
          <div className="lp-campus-head">
            <div>
              <p className="lp-eyebrow">Made for college life</p>
              <h2 id="campus-heading">From date party to office hours.</h2>
            </div>
            <p>Classes, chapter, recruiting, your org, your friends, and whatever’s happening Thursday. If it showed up in a screenshot, it can go on your calendar.</p>
          </div>
          <ul className="lp-uses">
            {USE_CASES.map(item => (
              <li key={item.title}>
                <span className="lp-use-emoji" aria-hidden="true">{item.emoji}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Application deadlines */}
        <section className="lp-wrap lp-deadlines" id="deadlines" aria-labelledby="deadlines-heading">
          <div className="lp-deadlines-copy">
            <p className="lp-eyebrow">For internship &amp; job season</p>
            <h2 id="deadlines-heading">You’ll <span className="lp-never">never</span> miss an application again.</h2>
            <p>Screenshot any posting you want to apply to, from Handshake, LinkedIn, your career center site, or a recruiter email. The due date goes straight on your calendar, with reminders before it closes.</p>

            <div className="lp-perk">
              <div className="lp-perk-head"><span aria-hidden="true">⏰</span><h3>Reminders when <em>you</em> want them</h3></div>
              <p>Pick your timing once in your account. Every deadline follows it, at 9 AM.</p>
              <ul className="lp-perk-chips" aria-label="Reminder options">
                <li>2 weeks before</li>
                <li className="is-on"><span aria-hidden="true">✓</span>1 week before</li>
                <li>3 days before</li>
                <li className="is-on"><span aria-hidden="true">✓</span>2 days before</li>
                <li>1 day before</li>
              </ul>
            </div>

            <div className="lp-perk">
              <div className="lp-perk-head"><span aria-hidden="true">🔗</span><h3>Back to the job in one click</h3></div>
              <p>No more digging through tabs to find the posting again.</p>
              <ol className="lp-perk-steps">
                <li><b>1</b>Open the deadline on your calendar</li>
                <li><b>2</b>Click the job posting link</li>
                <li><b>3</b>You’re back on the posting, ready to apply</li>
              </ol>
            </div>
          </div>

          <ol className="lp-deadline-story">
            <li className="lp-story-step">
              <p className="lp-story-label"><span>1</span>Screenshot the postings you like</p>
              <div className="lp-story-shots" aria-hidden="true">
                <div className="lp-job-card">
                  <i className="lp-job-logo">D</i>
                  <div><b>Audit &amp; Assurance Intern</b><span>Deloitte · Summer 2027</span><em>Apply by Fri, Jan 15</em></div>
                </div>
                <div className="lp-job-card">
                  <i className="lp-job-logo lp-job-logo-alt">P</i>
                  <div><b>Tax Consulting Intern</b><span>PwC · Summer 2027</span><em>Apply by Fri, Jan 15</em></div>
                </div>
              </div>
            </li>
            <li className="lp-story-step">
              <p className="lp-story-label"><span>2</span>They land on your calendar, together</p>
              <div className="lp-story-event" aria-hidden="true">
                <div className="lp-story-date"><small>FRI</small><strong>15</strong><small>JAN</small></div>
                <div className="lp-story-event-body">
                  <b>2 applications due: Deloitte, PwC</b>
                  <span>All day · on your Google Calendar</span>
                  <ul>
                    <li><span>Deloitte – Audit &amp; Assurance Intern</span><u>Open posting ↗</u></li>
                    <li><span>PwC – Tax Consulting Intern</span><u>Open posting ↗</u></li>
                  </ul>
                </div>
              </div>
            </li>
            <li className="lp-story-step">
              <p className="lp-story-label"><span>3</span>Reminders show up when you asked</p>
              <div className="lp-story-pings" aria-hidden="true">
                <div className="lp-ping"><i>🔔</i><div><b>Due in 1 week</b><span>2 applications: Deloitte, PwC</span></div><small>Fri 9:00 AM</small></div>
                <div className="lp-ping lp-ping-urgent"><i>⏰</i><div><b>Due in 2 days!</b><span>Deloitte and PwC close Friday</span></div><small>Wed 9:00 AM</small></div>
              </div>
            </li>
            <li className="lp-story-win">
              <span aria-hidden="true">🎉</span>
              <div><b>Both applications submitted. Two days early.</b><span>Zero missed deadlines this recruiting season.</span></div>
            </li>
          </ol>
        </section>

        {/* Before / after */}
        <section className="lp-wrap lp-compare" aria-labelledby="compare-heading">
          <h2 id="compare-heading" className="visually-hidden">Before and after Booked and Busy</h2>
          <div className="lp-compare-card lp-before">
            <p className="lp-compare-label">The old way</p>
            <ol>
              <li>Find the message (scroll, scroll, scroll)</li>
              <li>Open Google Calendar</li>
              <li>Type the title, pick the date, set the time</li>
              <li>Copy and paste the address</li>
              <li>Switch back to check for conflicts</li>
              <li>Repeat for every. single. event.</li>
            </ol>
          </div>
          <div className="lp-compare-arrow" aria-hidden="true">→</div>
          <div className="lp-compare-card lp-after">
            <p className="lp-compare-label">With Booked and Busy</p>
            <ol>
              <li>Screenshot it</li>
              <li>Upload it</li>
              <li>Tap <strong>Add to calendar</strong></li>
            </ol>
            <img src="/scattered-plans-to-calendar.png" alt="Screenshots from chats and invites becoming organized calendar events while a student relaxes at a laptop." width="1672" height="941" loading="lazy" />
          </div>
        </section>

        {/* Pricing */}
        <section className="lp-pricing" id="pricing" aria-labelledby="pricing-heading">
          <div className="lp-wrap lp-pricing-inner">
            <div className="lp-pricing-copy">
              <p className="lp-eyebrow">Pricing</p>
              <h2 id="pricing-heading">Caffeinate me. I’ll organize your semester.</h2>
              <p>$2.99 a month is less than one cold brew. It keeps Booked and Busy running, and it keeps me caffeinated enough to keep making it better. You get every feature, and the next one I build.</p>
              <p className="lp-pricing-sig">— Bri, Founder &amp; CCO (Chief Coffee Officer) ☕</p>
            </div>
            <div className="lp-price-card">
              <p className="lp-price-plan">Booked and Busy</p>
              <p className="lp-price"><strong>$2.99</strong><span>/ month</span></p>
              <ul>
                {FEATURES.map(feature => <li key={feature}>{feature}</li>)}
              </ul>
              <Link className="primary-button lp-button-lg" href={startHref}>{user ? 'Upload screenshots' : 'Sign up with Google'}</Link>
              <p className="lp-price-note">Try 3 screenshots free, no card needed. Then a 7-day free trial, and cancel any time.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="lp-wrap lp-faq" id="faq" aria-labelledby="faq-heading">
          <div>
            <p className="lp-eyebrow">FAQ</p>
            <h2 id="faq-heading">Good questions.</h2>
            <p className="lp-faq-side">Something else on your mind? Sign up and look around — you can review events before anything touches your calendar.</p>
          </div>
          <div className="lp-faq-list">
            {FAQS.map((item, index) => (
              <details key={item.q} open={index === 0}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Ending: phone → laptop */}
        <section className="lp-devices" aria-labelledby="final-heading">
          <div className="lp-wrap lp-devices-inner">
            <div className="lp-devices-copy">
              <p className="lp-eyebrow">Phone + laptop</p>
              <h2 id="final-heading">Screenshot on your phone.<br /><em>Plan on your laptop.</em></h2>
              <p>Your screenshots already live on your phone, so upload them straight from your camera roll, even while walking to class. Everything syncs to your account, so when you open your laptop it’s waiting for you next to your full calendar.</p>
              <ul className="lp-device-points">
                <li><span aria-hidden="true">📱</span><div><strong>Upload from your camera roll</strong>No AirDropping or emailing screenshots to yourself.</div></li>
                <li><span aria-hidden="true">🔄</span><div><strong>Syncs on its own</strong>Your review list follows you to any device you log in on.</div></li>
                <li><span aria-hidden="true">💻</span><div><strong>Review on the big screen</strong>See your whole day next to each event before you add it.</div></li>
              </ul>
            </div>

            <div className="lp-device-scene" aria-hidden="true">
              <div className="lp-laptop">
                <div className="lp-laptop-screen">
                  <div className="lp-laptop-bar"><i /><i /><i /></div>
                  <div className="lp-laptop-body">
                    <div className="lp-laptop-list">
                      <p className="mini-day-label">Friday, Apr 10</p>
                      <div className="mini-card mini-card-sel">
                        <p className="mini-card-title">Spring Date Party</p>
                        <p className="mini-card-meta"><b>Fri, Apr 10</b><br />9:00 PM – 1:00 AM</p>
                        <div className="mini-card-actions"><span className="mini-add">Add to calendar</span><span className="mini-skip">Skip</span></div>
                      </div>
                      <div className="mini-card">
                        <p className="mini-card-title">Philanthropy 5K</p>
                        <p className="mini-card-meta"><b>Sat, Apr 11</b><br />8:00 AM – 11:00 AM</p>
                      </div>
                    </div>
                    <div className="lp-laptop-cal">
                      <p className="mini-day-label">Your calendar</p>
                      <div className="mini-day">
                        <span className="mini-ev" style={{ top: 8, height: 26, background: '#7986cb' }}>ECON 101</span>
                        <span className="mini-ev" style={{ top: 40, height: 34, background: '#33b679' }}>Exec meeting</span>
                        <span className="mini-ev" style={{ top: 84, height: 22, background: '#f4511e' }}>Gym</span>
                        <span className="mini-ev mini-ev-proposed" style={{ top: 120, height: 48 }}>Date party</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lp-laptop-base" />
              </div>

              <div className="lp-phone">
                <span className="lp-phone-notch" />
                <p className="lp-phone-title">Start with a screenshot.</p>
                <div className="lp-phone-grid">
                  <span className="t-blue" /><span className="t-orange" /><span className="t-white" />
                  <span className="t-sky" /><span className="t-white" /><span className="t-blue" />
                </div>
                <span className="lp-phone-btn">Extract events (6)</span>
              </div>

              <span className="lp-sync-pill">✓ Synced</span>
              <svg className="lp-sync-arrow" viewBox="0 0 160 90"><path d="M8 78 C 40 10, 110 4, 150 30" /><path d="M136 18 L151 31 L132 37" /></svg>
            </div>

            <div className="lp-devices-cta">
              <Link className="primary-button lp-button-lg" href={startHref}>{startLabel} <span aria-hidden="true">→</span></Link>
              <p><strong>$2.99/month</strong><br />Sign in with Google</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-wrap lp-footer">
        <div className="lp-footer-brand">
          <span className="logo"><img src="/calendar-assistant-logo.png" alt="" width="157" height="157" /></span>
          <div>
            <strong>Booked and Busy<span className="brand-dot">.</span></strong>
            <span>Screenshot it. Schedule it.</span>
          </div>
        </div>
        <nav aria-label="Footer">
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <Link href={user ? '/account' : '/signup?mode=login'}>{user ? 'Your account' : 'Log in'}</Link>
        </nav>
        <p className="lp-footer-meta"><span>Thoughtfully made by <strong>Bri London</strong></span><span>Make time for the good things. <span className="footer-star">✳</span></span></p>
      </footer>
    </div>
  );
}
