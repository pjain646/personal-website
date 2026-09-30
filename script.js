const header = document.querySelector('.site-header');
const nav = document.querySelector('#site-nav');
const toggle = document.querySelector('.menu-toggle');
const signal = document.querySelector('#signal-field');
const reticle = document.querySelector('#cursor-reticle');

if (reticle && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let targetX = innerWidth / 2, targetY = innerHeight / 2, currentX = targetX, currentY = targetY;
  const followReticle = () => { currentX += (targetX - currentX) * .3; currentY += (targetY - currentY) * .3; reticle.style.left = `${currentX}px`; reticle.style.top = `${currentY}px`; requestAnimationFrame(followReticle); };
  addEventListener('pointermove', event => { targetX = event.clientX; targetY = event.clientY; reticle.classList.add('visible'); }, { passive: true });
  addEventListener('pointerdown', () => reticle.classList.add('pressed'));
  addEventListener('pointerup', () => reticle.classList.remove('pressed'));
  document.addEventListener('mouseleave', () => reticle.classList.remove('visible'));
  followReticle();
}

const sloganWord = document.querySelector('#slogan-word');
if (sloganWord) {
  const sloganTrack = sloganWord.querySelector('.slogan-track');
  const totalWords = 6;
  const wordWidths = ['3.5ch', '6.8ch', '6.5ch', '5.8ch', '4.4ch', '6.2ch'];
  let sloganIndex = 0;
  let resetting = false;
  const advanceSlogan = () => {
    if (resetting) return;
    sloganIndex += 1;
    sloganWord.style.setProperty('--slogan-width', wordWidths[sloganIndex % totalWords]);
    sloganTrack.style.transition = '';
    sloganTrack.style.transform = `translateY(-${sloganIndex}em)`;
    if (sloganIndex === totalWords) {
      resetting = true;
      setTimeout(() => {
        sloganTrack.style.transition = 'none';
        sloganTrack.style.transform = 'translateY(0)';
        sloganIndex = 0;
        requestAnimationFrame(() => { sloganTrack.style.transition = ''; resetting = false; });
      }, 240);
    }
  };
  sloganWord.addEventListener('mouseenter', advanceSlogan);
  sloganWord.addEventListener('click', advanceSlogan);
  sloganWord.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); advanceSlogan(); } });
}

document.querySelector('#year').textContent = new Date().getFullYear();
toggle.addEventListener('click', () => { const isOpen = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', isOpen); });
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));

if (matchMedia('(hover: hover)').matches) {
  signal.addEventListener('pointermove', event => {
    const rect = signal.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const velocity = Math.min(Math.abs(event.movementX) + Math.abs(event.movementY), 28);
    signal.style.setProperty('--x', `${x}%`);
    signal.style.setProperty('--y', `${y}%`);
    signal.style.setProperty('--glow-radius', '330px');
    signal.style.setProperty('--signal', Math.max(.2, velocity / 28));
    signal.querySelectorAll('.hero-words span').forEach((word, index) => word.style.setProperty('--shift', `${(x - 50) * (index - 1) * .12}px`));
  });
  signal.addEventListener('pointerleave', () => { signal.style.setProperty('--x', '50%'); signal.style.setProperty('--y', '50%'); signal.style.setProperty('--signal', 0); signal.style.setProperty('--glow-radius', '0px'); });
}

document.querySelectorAll('.project').forEach(project => {
  const selectProject = () => { const key = project.dataset.preview; document.querySelectorAll('.project').forEach(item => item.classList.toggle('active', item === project)); document.querySelectorAll('[data-preview-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.previewPanel === key)); };
  project.addEventListener('mouseenter', selectProject); project.querySelector('button').addEventListener('focus', selectProject);
});
const sections = [...document.querySelectorAll('main section[id], footer[id]')]; const links = [...nav.querySelectorAll('a')];
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)); }), { rootMargin: '-35% 0px -55% 0px' }); sections.forEach(section => observer.observe(section));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = [...document.querySelectorAll('.reveal')];
if (reduceMotion) {
  reveals.forEach(element => element.classList.add('visible'));
} else {
  document.querySelectorAll('.reveal-stagger').forEach(group => {
    [...group.children].filter(element => element.classList.contains('reveal')).forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${index * 90}ms`);
    });
  });
  const projectPreview = document.querySelector('.project-preview.reveal');
  if (projectPreview) projectPreview.style.setProperty('--reveal-delay', '160ms');
  const heroReveals = [...document.querySelectorAll('.hero .reveal')];
  const heroRevealSet = new Set(heroReveals);
  let heroArmed = false;
  // Enter a bit inside the viewport. Leave only once the element is fully
  // outside, then drop .visible so the next pass starts from opacity 0 / translateY.
  const showObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting || heroRevealSet.has(entry.target)) return;
    entry.target.classList.add('visible');
  }), { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  const heroShowObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting || !heroArmed) return;
    entry.target.classList.add('visible');
  }), { threshold: 0.18 });
  const hideObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) return;
    entry.target.classList.remove('visible');
  }), { threshold: 0 });
  reveals.forEach(element => {
    hideObserver.observe(element);
    (heroRevealSet.has(element) ? heroShowObserver : showObserver).observe(element);
  });
  // A double rAF from parse time runs during the reload flash, so the rise
  // is finished before the first frame on screen. Wait until load has painted,
  // hold the hidden state for a beat, then start the stagger. Later passes
  // replay from the hero observer once this first entrance is armed.
  const playHeroEntrance = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        heroArmed = true;
        heroReveals.forEach(element => {
          const rect = element.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < innerHeight) element.classList.add('visible');
        });
      });
    });
  };
  const armHeroEntrance = () => setTimeout(playHeroEntrance, 420);
  if (document.readyState === 'complete') armHeroEntrance();
  else window.addEventListener('load', armHeroEntrance, { once: true });
}
window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 10), { passive: true });

const metrics = document.querySelectorAll('[data-count]');
const metricObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  const metric = entry.target; const target = Number(metric.dataset.count); const prefix = metric.dataset.prefix || ''; const suffix = metric.dataset.suffix || '';
  const start = performance.now(); const duration = 900;
  const tick = now => { const progress = Math.min((now - start) / duration, 1); const value = Math.round(target * (1 - Math.pow(1 - progress, 3))); metric.textContent = `${prefix}${value}${suffix}`; if (progress < 1) requestAnimationFrame(tick); };
  metric.textContent = `${prefix}0${suffix}`; requestAnimationFrame(tick); metricObserver.unobserve(metric);
}), { threshold: .75 });
metrics.forEach(metric => metricObserver.observe(metric));

const thread = document.querySelector('#work-thread');
const principle = document.querySelector('#thread-principle');
if (thread && principle) {
  const entries = [...thread.querySelectorAll('.thread-entry')];
  const activateEntry = entry => {
    entries.forEach(item => item.classList.toggle('active', item === entry));
    principle.style.opacity = 0;
    principle.style.transform = 'translateY(5px)';
    setTimeout(() => { principle.textContent = entry.dataset.principle; principle.style.opacity = 1; principle.style.transform = ''; }, 130);
  };
  const entryObserver = new IntersectionObserver(items => items.forEach(item => { if (item.isIntersecting) activateEntry(item.target); }), { threshold: .65 });
  entries.forEach(entry => { entryObserver.observe(entry); entry.addEventListener('mouseenter', () => activateEntry(entry)); });
  const drawThread = () => {
    const rect = thread.getBoundingClientRect();
    const viewportPoint = innerHeight * .62;
    const progress = Math.max(0, Math.min(1, (viewportPoint - rect.top) / rect.height));
    thread.style.setProperty('--thread-progress', `${progress * 100}%`);
  };
  addEventListener('scroll', drawThread, { passive: true }); drawThread();
}
