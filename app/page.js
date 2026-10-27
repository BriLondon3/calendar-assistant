export default function Home() {
  return (
    <div className="site">
      <header><a className="brand" href="/" aria-label="Calendar Assistant home"><span className="logo"><img src="/calendar-assistant-logo.png" alt="" width="157" height="157" /></span>calendar assistant<span className="brand-dot">.</span></a><span className="header-note">A little more time for you</span></header>
      <main>
        <section className="intro" aria-labelledby="headline">
          <div className="eyebrow"><span /> LESS JUGGLING. MORE LIVING.</div>
          <h1 id="headline">Your day,<br />with a little<br /><em>breathing room.</em></h1>
          <p>Meet Calendar Assistant. A simpler way to organize your schedule, keep track of what’s next, and make time for what matters.</p>
          <div className="signoff"><span className="small-star">✳</span><span>A calmer calendar. A clearer head.</span></div>
        </section>
        <div className="illustration" role="img" aria-label="Illustrative calendar with a focus time appointment and room to breathe">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <span className="spark spark-one">✳</span><span className="spark spark-two">✧</span>
          <div className="calendar-card">
            <div className="calendar-top"><span>YOUR WEEK, SIMPLIFIED</span><span className="calendar-dots">•••</span></div>
            <div className="month">A fresh start<span>↗</span></div>
            <div className="weekdays">{['M','T','W','T','F'].map((day,index) => <span key={index}>{day}</span>)}</div>
            <div className="dates">{[12,13,14,15,16].map(day => <span key={day} className={day === 14 ? 'today' : ''}>{day}</span>)}</div>
            <div className="schedule"><div className="schedule-line"/><div className="schedule-line"/><div className="schedule-line"/><div className="event"><span className="event-dot"/><div>Time to focus<small>A little space to do your thing.</small></div><span className="event-sun">☼</span></div></div>
            <div className="calendar-bottom"><span className="check">✓</span> Everything in its own time.</div>
          </div>
          <div className="floating-note"><span>✓</span> Room for what matters.</div>
          <span className="illustration-caption">A little less busy. A little more you.</span>
        </div>
      </main>
      <footer><span>Thoughtfully made by <strong>Bri London</strong></span><span>Make time for the good things. <span className="footer-star">✳</span></span></footer>
    </div>
  );
}
