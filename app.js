const links = [...document.querySelectorAll('.sidebar a')];
const sections = links
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

const collapsibleSections = [...document.querySelectorAll('main section')];

const setSectionOpen = (section, isOpen) => {
  const toggle = section.querySelector('.section-toggle');
  const content = section.querySelector('.section-content');
  if (!toggle || !content) return;

  section.classList.toggle('is-open', isOpen);
  toggle.setAttribute('aria-expanded', String(isOpen));
  content.hidden = !isOpen;
};

collapsibleSections.forEach((section, index) => {
  if (section.querySelector('.section-toggle')) return;

  const heading = section.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
  const title = heading?.textContent?.trim() || `Sezione ${index + 1}`;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'section-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = `<span>${title}</span><span class="section-chevron" aria-hidden="true">▸</span>`;

  const content = document.createElement('div');
  content.className = 'section-content';
  content.hidden = true;

  const children = [...section.children];
  children.forEach((child) => {
    if (child === heading) return;
    content.appendChild(child);
  });

  section.innerHTML = '';
  section.append(toggle, content);

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') !== 'true';
    setSectionOpen(section, isOpen);
  });
});

const openSectionFromHash = () => {
  if (!window.location.hash) return;
  const target = document.querySelector(window.location.hash);
  if (!target || !target.matches('section')) return;
  setSectionOpen(target, true);
};

openSectionFromHash();
window.addEventListener('hashchange', openSectionFromHash);

if (sections.length) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = `#${entry.target.id}`;
      const link = links.find(a => a.getAttribute('href') === id);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0.1 });

  sections.forEach(section => obs.observe(section));
}
