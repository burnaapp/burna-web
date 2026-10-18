// Set this to the App Store (or TestFlight) link once it exists. While empty, buttons say "coming soon".
const STORE_URL = "";
const WAITLIST_API = "https://calshi-api-480109941557.us-central1.run.app";

(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Header and hero buttons: send people to the waitlist until there is a store link.
  $$("[data-store-link]").forEach((a) => {
    if (STORE_URL) { a.href = STORE_URL; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Download for iPhone"; }
  });

  // Waitlist form
  const form = $("#wl"), msg = $("#wl-msg"), btn = $("#wl-btn");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const email = String(data.get("email") || "").trim();
      msg.className = "";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.className = "err"; msg.textContent = "Please enter a valid email."; return; }
      btn.disabled = true; msg.textContent = "Adding you…";
      try {
        const res = await fetch(WAITLIST_API + "/v1/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, website: String(data.get("website") || ""), source: "calshi.fit" }),
        });
        if (res.status === 429) throw new Error("Too many tries. Please wait a minute and try again.");
        if (!res.ok) throw new Error("Something went wrong. Please try again.");
        form.reset();
        msg.textContent = "You're on the list. We'll email you when Calshi launches.";
        btn.textContent = "You're in ✓";
      } catch (err) {
        msg.className = "err";
        msg.textContent = err.message || "Something went wrong. Please try again.";
        btn.disabled = false;
      }
    });
  }

  const steps = $$(".step");
  const screens = $$(".screen");
  const phone = $(".phone");
  const s1 = $(".s1");
  const kcalEl = $("#kcal"), barEl = $("#bar2"), pctEl = $("#pct");
  const workouts = $$(".workout");
  const prizeEl = $("#prize"), rankEl = $("#rank");
  const rows = Object.fromEntries($$(".lrow").map((r) => [r.dataset.k, r]));
  const names = ["a", "b", "d", "me"]; // order at start: you are 4th
  let confettiFired = false;

  const GOAL = 10000, FINAL_KCAL = 5180, DAYS_LEFT = 16, PRIZE = 480;

  const MY_SCORE = [8100, 8400, 9250, 9520]; // your total at rank 4, 3, 2, 1
  function layoutBoard(order) {
    const myRank = order.indexOf("me");
    $("b", rows.me).textContent = MY_SCORE[3 - myRank].toLocaleString("en-US");
    order.forEach((k, i) => {
      rows[k].style.transform = `translateY(${i * 48}px)`;
      $("em", rows[k]).textContent = i + 1;
    });
  }
  layoutBoard(names);

  function render() {
    const vh = innerHeight;
    const anchor = innerWidth <= 860 ? vh * 0.74 : vh * 0.5;
    let active = 0, p = 0;
    steps.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.top <= anchor && r.bottom > anchor) { active = i; p = clamp((anchor - r.top) / r.height); }
      else if (r.top > anchor && i === 0) { active = 0; p = 0; }
      else if (r.bottom <= anchor && i === steps.length - 1) { active = i; p = 1; }
    });
    steps.forEach((el, i) => el.classList.toggle("on", i === active));
    screens.forEach((el, i) => el.classList.toggle("on", i === active));
    // On phones the mockup scales to the room the pinned stage actually has (browser bars change it).
    const stage = $(".stage");
    const fit = innerWidth <= 860 && stage ? Math.min(0.62, Math.max(0.3, (stage.clientHeight - 84) / 660)) : 1;
    phone.style.transform = innerWidth <= 860
      ? `scale(${fit.toFixed(3)}) rotate(${-2 + active}deg)` : `rotate(${-2 + active * 1.4}deg)`;

    // step 2: join
    s1.classList.toggle("joined", active === 1 && p > 0.55);

    // step 3: progress
    const e = reduced ? 1 : ease(clamp((active === 2 ? p : active > 2 ? 1 : 0) / 0.85));
    const kcal = Math.round(FINAL_KCAL * e);
    kcalEl.textContent = kcal.toLocaleString("en-US");
    barEl.style.width = (kcal / GOAL * 100).toFixed(1) + "%";
    pctEl.textContent = Math.round(kcal / GOAL * 100) + "% DONE";
    const pace = Math.round((GOAL - kcal) / DAYS_LEFT);
    $(".rowline .y").textContent = pace + " KCAL/DAY TO FINISH";
    [0.18, 0.42, 0.66].forEach((t, i) => workouts[i].classList.toggle("in", (active === 2 && p > t) || active > 2));

    // step 4: win
    const q = active === 3 ? p : active > 3 ? 1 : 0;
    let order = ["a", "b", "d", "me"];
    if (q > 0.10) order = ["a", "b", "me", "d"];
    if (q > 0.22) order = ["a", "me", "b", "d"];
    if (q > 0.36) order = ["me", "a", "b", "d"];
    layoutBoard(order);
    const myRank = order.indexOf("me") + 1;
    rankEl.textContent = "#" + myRank;
    $(".rank span").textContent = myRank === 1 ? "YOU WON" : "CLIMBING";
    const won = myRank === 1;
    prizeEl.textContent = (won ? PRIZE : 0).toLocaleString("en-US");
    if (won && active === 3 && !confettiFired && !reduced) { confettiFired = true; burst(); }
    if (!won) confettiFired = false;
  }

  // Confetti (canvas, no libraries)
  const cv = $("#confetti");
  const ctx = cv.getContext("2d");
  let parts = [], raf = 0;
  function burst() {
    parts = Array.from({ length: 90 }, () => ({
      x: cv.width / 2, y: cv.height * 0.35,
      vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 9 - 3,
      s: Math.random() * 7 + 4, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: ["#FAFC4D", "#ffffff", "#9c9e1d"][Math.floor(Math.random() * 3)],
    }));
    cancelAnimationFrame(raf);
    const tick = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts.forEach((p) => {
        p.vy += 0.3; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s, p.s, p.s * 2); ctx.restore();
      });
      parts = parts.filter((p) => p.y < cv.height + 30);
      if (parts.length) raf = requestAnimationFrame(tick);
    };
    tick();
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { render(); ticking = false; });
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  render();
})();
