import Link from 'next/link';
import { getCurrentUser } from './auth-client';
import SiteHeader from './components/site-header';
import ReviewDemo from './components/review-demo';
import './landing.css';

export const dynamic = 'force-dynamic';

const SOURCES = ['GroupMe', 'Flare', 'iMessage', 'Email', 'Flyers', 'Instagram stories', 'Discord', 'Class announcements', 'Slack', 'Event posters'];

const CHAOS = [
  { app: 'GroupMe · Club Soccer', text: 'IM game vs Delta this Sat 4pm, field 3. be there!!', tone: 'blue' },
  { app: 'Flare', text: '✨ Fall Formal — Sat, Nov 22 · 9 PM · The Boathouse', tone: 'orange' },
  { app: 'Email · Prof. Diaz', text: 'Office hours moved: this week only, Thu 3–4pm', tone: 'white' },
  { app: 'Text · Maya', text: 'brunch sunday 11?? the usual spot 🥞', tone: 'sky' },
  { app: 'Flyer', text: 'CAREER FAIR · Wed 10am–2pm · Student Union Ballroom', tone: 'white' },
];

const USE_CASES = [
  { emoji: '💬', title: 'Club & org meetings', copy: 'The weekly “meeting moved to Rm 204” buried 300 messages deep in GroupMe.' },
  { emoji: '🎉', title: 'Parties & socials', copy: 'Flare invites, formals, and date parties — with the address already filled in.' },
  { emoji: '📚', title: 'Class curveballs', copy: 'Rescheduled exams, review sessions, and office hours from professor emails.' },
  { emoji: '⚽', title: 'Game days & intramurals', copy: 'Practice times, IM schedules, and tailgates your team posts in the chat.' },
  { emoji: '💼', title: 'Career stuff', copy: 'Info sessions, career fairs, and coffee chats from flyers and recruiter emails.' },
  { emoji: '🧋', title: 'Friend plans', copy: 'The “wait, what time is brunch?” texts — so you actually show up.' },
];

const FEATURES = [
  'Upload up to 10 screenshots at a time',
  'Pulls out the title, date, time, place, and details',
  'Review side by side with your Google Calendar',
  'Edit, skip, or add each event in one click',
  'Remove anything you added by mistake',
  'Your review list syncs across your devices',
];

const FAQS = [
  { q: 'What can I screenshot?', a: 'Anything with event details on it: GroupMe and Flare posts, texts, emails, Instagram stories, flyers, and posters. As long as the name, date, and time are visible in the image, Booked and Busy can read them. PNG, JPG, and WebP images up to 3 MB each work.' },
  { q: 'Does it add things to my calendar automatically?', a: 'No — nothing lands on your calendar without your OK. Every event goes into a review list first, next to that day on your calendar, so you can fix details, skip it, or add it with one click.' },
  { q: 'What if it reads something wrong?', a: 'Tap the pencil on any event to edit the name, dates, times, location, or description before you add it. If a detail was unclear in the screenshot, the event shows extraction notes so you know what to double-check.' },
  { q: 'Which calendars does it work with?', a: 'Google Calendar today. You connect it once from your account page and choose which plans to add. More calendar apps are on the roadmap.' },
  { q: 'Is my info private?', a: 'Your screenshots are sent to Google Gemini only to read the event details. Calendar access is limited to events on calendars you own, your Google connection is encrypted (AES-256-GCM), and your review list is only visible to your account. You can disconnect Google Calendar at any time from your account page.' },
  { q: 'Can I use it on my phone?', a: 'Yes. Booked and Busy runs in your browser, so you can upload straight from your camera roll. Your review list syncs, so you can upload on your phone and review on your laptop.' },
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
    <div className="lp">
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
            <p className="lp-cta-note"><strong>$2.99/month</strong> · Works with Google Calendar · Nothing gets added without your OK</p>
          </div>

          <div className="lp-wrap lp-demo-wrap" id="demo">
            <span className="lp-sticker lp-sticker-left" aria-hidden="true">no more typing<br />it in by hand ✍️</span>
            <span className="lp-sticker lp-sticker-right" aria-hidden="true">see conflicts<br />before you say yes 👀</span>
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
            <p className="lp-problem-kicker">You already screenshot everything. Booked and Busy makes those screenshots do the work.</p>
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
                  <span className="lp-art-frame" />
                  <span className="lp-art-phone"><i /><i /><i className="short" /></span>
                </div>
                <span className="lp-step-num">01</span>
                <h3>Upload your screenshots</h3>
                <p>Drop in up to 10 at once — group chats, invites, emails, flyers. Booked and Busy reads every event out of them.</p>
              </li>
              <li>
                <div className="lp-step-art lp-art-review" aria-hidden="true">
                  <span className="lp-art-card"><i /><i className="short" /><b>✎</b></span>
                  <span className="lp-art-cal"><i className="solid" /><i className="dashed" /></span>
                </div>
                <span className="lp-step-num">02</span>
                <h3>Review against your calendar</h3>
                <p>Each event sits right next to that day on your Google Calendar. Spot conflicts, fix a time, or skip what you don’t need.</p>
              </li>
              <li>
                <div className="lp-step-art lp-art-add" aria-hidden="true">
                  <span className="lp-art-btn">Add to calendar</span>
                  <span className="lp-art-check">✓</span>
                  <Sparks className="art-sparks" />
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
              <h2 id="campus-heading">Built for the group chat era.</h2>
            </div>
            <p>Between classes, clubs, work, and actually having a social life, your week moves fast. Booked and Busy keeps up with it.</p>
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
              <h2 id="pricing-heading">Less than one iced coffee a month.</h2>
              <p>One simple plan with everything included. If it saves you from missing one thing you actually wanted to go to, it’s paid for itself.</p>
            </div>
            <div className="lp-price-card">
              <p className="lp-price-plan">Booked and Busy</p>
              <p className="lp-price"><strong>$2.99</strong><span>/ month</span></p>
              <ul>
                {FEATURES.map(feature => <li key={feature}>{feature}</li>)}
              </ul>
              <Link className="primary-button lp-button-lg" href={startHref}>{user ? 'Upload screenshots' : 'Sign up with Google'}</Link>
              <p className="lp-price-note">Works with Google Calendar today. More calendars coming.</p>
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

        {/* Final CTA */}
        <section className="lp-wrap" aria-labelledby="final-heading">
          <div className="lp-final">
            <Sparks className="final-sparks-a" />
            <Sparks className="final-sparks-b" />
            <h2 id="final-heading">The group chat already made the plans.<br /><em>Let’s get them on your calendar.</em></h2>
            <Link className="lp-final-button" href={startHref}>{startLabel} <span aria-hidden="true">→</span></Link>
            <p>$2.99/month · Google Calendar</p>
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
