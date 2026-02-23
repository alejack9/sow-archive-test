const links = [...document.querySelectorAll('.sidebar a')];
const sections = links
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);
const sidebarSearchInput = document.querySelector('#sidebar-search-input');

const collapsibleSections = [...document.querySelectorAll('main section')];

const setSectionOpen = (section, isOpen) => {
  if (!section) return;
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

if (sidebarSearchInput) {
  const normalizeText = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const crossPageSearchIndex = new Map();

  const updateCrossPageIndex = async () => {
    const externalLinks = links.filter((link) => {
      const href = link.getAttribute('href');
      return href && !href.startsWith('#');
    });

    await Promise.all(externalLinks.map(async (link) => {
      const href = link.getAttribute('href');
      if (!href || crossPageSearchIndex.has(href)) return;

      try {
        const response = await fetch(href);
        if (!response.ok) {
          crossPageSearchIndex.set(href, '');
          return;
        }

        const html = await response.text();
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        const pageText = normalizeText(parsed.body?.textContent || '');
        crossPageSearchIndex.set(href, pageText);
      } catch {
        crossPageSearchIndex.set(href, '');
      }
    }));
  };

  const filterSidebarAndSections = (query) => {
    const normalizedQuery = normalizeText(query);

    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) {
        const linkText = normalizeText(link.textContent || '');
        const indexedText = crossPageSearchIndex.get(href) || '';
        const matches = normalizedQuery.length === 0
          || linkText.includes(normalizedQuery)
          || indexedText.includes(normalizedQuery);

        link.classList.toggle('is-hidden', !matches);
        return;
      }

      const targetSection = document.querySelector(href);
      const linkText = normalizeText(link.textContent || '');
      const sectionText = normalizeText(targetSection?.textContent || '');
      const matches = normalizedQuery.length === 0
        || linkText.includes(normalizedQuery)
        || sectionText.includes(normalizedQuery);

      link.classList.toggle('is-hidden', !matches);
      targetSection?.classList.toggle('is-hidden-by-search', !matches);

      if (!matches) {
        setSectionOpen(targetSection, false);
      }
    });
  };

  sidebarSearchInput.addEventListener('input', (event) => {
    filterSidebarAndSections(event.target.value);
  });

  updateCrossPageIndex();
}
