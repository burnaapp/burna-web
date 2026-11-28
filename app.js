// Burna website: the time left in this week's game, and sections rising into place as they scroll in.

(function () {
  window.burnaReady = true;

  // Weeks run from Sunday 3 AM to the next Sunday 3 AM, Pacific time, as in the app. Shown as the app shows it: 1D 17H, 5H 12M, 40M.
  var live = document.getElementById('live');
  if (live && window.Intl) {
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles', hourCycle: 'h23',
        year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'
      });
    } catch (e) { fmt = null; }

    // Milliseconds Pacific time is ahead of UTC at a moment (negative).
    var offset = function (t) {
      var p = {};
      fmt.formatToParts(new Date(t)).forEach(function (x) { p[x.type] = +x.value; });
      return Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - Math.floor(t / 1000) * 1000;
    };

    var left = function () {
      var now = Date.now();
      var wall = now + offset(now);                 // Pacific wall clock, as if it were UTC
      var d = new Date(wall);
      var day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      var end = day + ((7 - d.getUTCDay()) % 7) * 864e5 + 3 * 36e5;
      if (end <= wall) end += 7 * 864e5;
      var endUTC = end - offset(end - offset(now)); // the offset in force at the end, in case the clocks change this week
      var s = Math.max(0, Math.floor((endUTC - now) / 1000));
      var dd = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
      return dd > 0 ? dd + 'D ' + h + 'H' : (h > 0 ? h + 'H ' + m + 'M' : m + 'M');
    };

    if (fmt && fmt.formatToParts) {
      var label = document.createTextNode('This week ends in ');
      var value = document.createElement('b');
      var tick = function () { value.textContent = left(); };
      tick();
      live.textContent = '';
      live.appendChild(label);
      live.appendChild(value);
      setInterval(tick, 30000);
    }
  }

  // Sections rise into place the first time they come into view (the CSS turns this off for reduced motion).
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    for (var i = 0; i < items.length; i++) items[i].classList.add('in');
    return;
  }
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      seen.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  for (var j = 0; j < items.length; j++) seen.observe(items[j]);
})();
