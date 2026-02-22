const links = [...document.querySelectorAll('.sidebar a')];
const sections = links
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

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
