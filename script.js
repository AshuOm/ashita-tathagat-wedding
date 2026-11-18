(() => {
  const gate = document.getElementById('gate-overlay');
  const enter = document.getElementById('gate-enter');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const images = [...gate.querySelectorAll('.gate-panel')];
  const revealGate = () => { gate.classList.add('is-ready'); document.body.classList.add('gate-closed'); enter.focus({ preventScroll: true }); };
  if (!reduced) {
    Promise.all(images.map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.addEventListener('load',resolve,{once:true}); img.addEventListener('error',resolve,{once:true}); }))).then(revealGate);
  }
  enter.addEventListener('click', () => {
    enter.disabled = true;
    gate.classList.add('opening');
    document.body.classList.remove('gate-closed');
    window.setTimeout(() => { gate.classList.remove('is-ready'); gate.hidden = true; }, reduced ? 0 : 2750);
  });
  const target = Date.parse('2026-12-05T16:00:00+05:30');
  const clock = document.getElementById('clock');
  const done = document.getElementById('countdown-done');
  function updateCountdown() {
    const seconds = Math.max(0,Math.ceil((target-Date.now())/1000));
    if (!seconds) { clock.hidden = true; done.hidden = false; return false; }
    const values = [Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60];
    document.querySelectorAll('[data-time]').forEach((node,i) => { node.textContent = String(values[i]).padStart(2,'0'); });
    return true;
  }
  updateCountdown();
  const timer = setInterval(() => { if (!document.hidden && !updateCountdown()) clearInterval(timer); },1000);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {if (entry.isIntersecting) {entry.target.classList.add('in');observer.unobserve(entry.target);}}),{threshold:.12});
    document.querySelectorAll('.reveal').forEach(node => observer.observe(node));
  } else document.querySelectorAll('.reveal').forEach(node => node.classList.add('in'));
  // Keep the envelope native and fully usable without JavaScript.
  const modal = document.getElementById('memory-overlay');
  const openGallery = document.getElementById('memories-open');
  const closeGallery = document.getElementById('memory-close');
  const close = () => { modal.hidden = true; document.body.style.overflow = ''; openGallery.focus(); };
  openGallery.addEventListener('click', () => { modal.hidden = false; document.body.style.overflow = 'hidden'; closeGallery.focus(); });
  closeGallery.addEventListener('click', close);
  modal.addEventListener('click',e => { if(e.target===modal) close(); });
  document.addEventListener('keydown',e => {if(e.key==='Escape'&&!modal.hidden) close();});
  const form = document.getElementById('rsvp-form');
  const result = document.getElementById('rsvp-result');
  const text = document.getElementById('rsvp-text');
  const attendance = document.getElementById('attendance');
  const guests = document.getElementById('guest-count');
  const eventGroup = document.getElementById('rsvp-events');
  attendance.addEventListener('change', () => {
    const decline = attendance.value==='decline'; guests.disabled=decline;guests.required=!decline;eventGroup.disabled=decline;
  });
  form.addEventListener('submit', e => {
    e.preventDefault();if (!form.reportValidity()) return;
    const data = new FormData(form);
    const choice = data.get('attendance');
    const status = choice==='accept'?'Attending':choice==='decline'?'Unable to attend':'Yet to confirm';
    const intro = choice==='decline'?'Sending you both love and warm wishes for your celebrations.':choice==='unsure'?'We look forward to your celebrations and will confirm our plans soon.':'We are delighted to celebrate with you.';
    const selected = data.getAll('events');
    const details = choice==='decline'?'':`\nNumber of guests, including me: ${data.get('guests')||1}\nEvents: ${selected.join(', ')||'Yet to confirm'}`;
    const note = String(data.get('message')||'').trim();
    text.value=`Dear Ashita & Tathagat,\n${intro}\n\nName: ${String(data.get('name')||'').trim()}\nAttendance: ${status}${details}${note?'\n\nMessage: '+note:''}`;
    document.querySelectorAll('[data-rsvp-whatsapp]').forEach(link => {
      link.href = 'https://wa.me/' + link.dataset.rsvpWhatsapp + '?text=' + encodeURIComponent(text.value);
    });
    form.hidden = true;result.hidden=false;result.focus();
  });
  document.getElementById('rsvp-edit').addEventListener('click', () => {form.hidden=false;result.hidden=true;document.getElementById('guest-name').focus();});
  document.getElementById('rsvp-copy').addEventListener('click', async () => {
    const status=document.getElementById('rsvp-status');
    try {await navigator.clipboard.writeText(text.value);status.textContent='Copied. Paste into a message to the family.';}
    catch {text.focus();text.select();status.textContent='Select and copy the message above.';}
  });
})();
