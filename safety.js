'use strict';
(() => {
  const tabs = document.querySelector('#energy-tabs');
  const panel = document.querySelector('#energy-panel');
  const grid = document.querySelector('#energy-drawings');
  const series = window.safetySeries;
  const make = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function select(index) {
    [...tabs.children].forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    const source = series[index];
    panel.setAttribute('aria-labelledby', `energy-tab-${source.id}`);
    document.querySelector('#energy-heading').textContent = `${source.title}: acht leerfasen in beeld`;
    document.querySelector('#energy-description').textContent = `Herken de energiebron: ${source.subject.toLowerCase()}. Lees de maatregel onder elke tekening; de afbeelding alleen is geen werkinstructie.`;
    grid.replaceChildren();
    source.steps.forEach((step, i) => {
      const card = make('article', undefined, 'drawing-card');
      const figure = make('figure');
      const image = make('img');
      image.src = step.image;
      image.alt = `${source.title}, fase ${i + 1}: ${step.title}. Conceptuele tekening van ${source.subject.toLowerCase()}.`;
      image.width = 340; image.height = 240;
      image.loading = 'lazy';
      const caption = make('figcaption');
      caption.append(make('span', `${String(i + 1).padStart(2, '0')} / ${step.phase}`, 'drawing-phase'), make('h4', step.title), make('p', step.text));
      const download = make('a', 'Open de tekening ↗', 'text-link');
      download.href = step.image; download.target = '_blank'; download.rel = 'noopener noreferrer';
      download.setAttribute('aria-label', `Open tekening: ${source.title}, ${step.title}`);
      caption.append(download); figure.append(image, caption); card.append(figure); grid.append(card);
    });
  }
  series.forEach((source, index) => {
    const tab = make('button', source.title);
    tab.type = 'button'; tab.role = 'tab'; tab.id = `energy-tab-${source.id}`;
    tab.setAttribute('aria-controls', 'energy-panel');
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % series.length;
      if (event.key === 'ArrowLeft') next = (index + series.length - 1) % series.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = series.length - 1;
      if (next !== undefined) { event.preventDefault(); select(next); tabs.children[next].focus(); }
    });
    tabs.append(tab);
  });
  select(0);
})();
