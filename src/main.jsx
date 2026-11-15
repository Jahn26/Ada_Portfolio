import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../style.css';

const words = [
  { key: 'ABOUTME', label: 'ABOUT ME', path: '#about', start: [6, 0], delta: [0, 1] },
  { key: 'ARTICLES', label: 'ARTICLES', path: '#articles', start: [0, 7], delta: [1, 0] },
  { key: 'PICTURES', label: 'PICTURES', path: '#pictures', start: [0, 0], delta: [1, 1] },
];
const size = 8;
function makeGrid() {
  const rows = Array.from({ length: size }, () => Array(size).fill(''));
  words.forEach(({ key, start: [r, c], delta: [dr, dc] }) => [...key].forEach((letter, i) => { rows[r + dr * i][c + dc * i] = letter; }));
  let seed = 731;
  const randomLetter = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(seed / 4294967296 * 26)]; };
  return rows.map(row => row.map(letter => letter || randomLetter()));
}
const grid = makeGrid();
const keyOf = ([r, c]) => `${r},${c}`;
const cellPath = (a, b) => {
  const dr = b[0] - a[0], dc = b[1] - a[1], count = Math.max(Math.abs(dr), Math.abs(dc));
  if (!count) return [a];
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return [];
  return Array.from({ length: count + 1 }, (_, i) => [a[0] + Math.sign(dr) * i, a[1] + Math.sign(dc) * i]);
};

function Topbar() {
  return <nav className="topbar"><a href="#home" className="micro">CREATIVE ARCHIVE · NO. 01</a><a className="monogram" href="#home">GV</a><a href="#puzzle" className="micro underlined">ENTER THE PUZZLE</a></nav>;
}

function Hero() {
  return <section className="hero" id="home">
    <Topbar />
    <div className="role-tag">DESIGNER · WRITER · IMAGE MAKER</div>
    <div className="photo-grid" aria-label="Four panel editorial portrait collage">
      {[1, 2, 3, 4].map(n => <div className={`photo p${n}`} key={n}><img src="/hero-image.jpeg" alt="" /><span>0{n} / STUDY</span></div>)}
      <h1 className="signature">Ada</h1>
    </div>
    <div className="caption">A collection of curious<br />things, carefully made.</div>
    <a className="scroll-cue" href="#puzzle">SCROLL TO DISCOVER <b>↓</b></a><span className="spark s1">✦</span><span className="spark s2">✦</span>
  </section>;
}

function WordSearch() {
  const [found, setFound] = useState([]);
  const [selected, setSelected] = useState([]);
  const [anchor, setAnchor] = useState(null);
  const [circles, setCircles] = useState([]);
  const [message, setMessage] = useState('');
  const boardRef = useRef(null);
  const cellRefs = useRef({});
  const selectedSet = useMemo(() => new Set(selected.map(keyOf)), [selected]);
  const foundSet = useMemo(() => new Set(found), [found]);

  const finish = path => {
    if (!path.length) { setSelected([]); setAnchor(null); return; }
    const value = path.map(([r, c]) => grid[r][c]).join('');
    const match = words.find(word => !foundSet.has(word.key) && (value === word.key || [...value].reverse().join('') === word.key));
    if (match) {
      const actual = value === match.key ? path : [...path].reverse();
      setFound(current => [...current, match.key]);
      setCircles(current => [...current, actual]);
      if (found.length === 2) setMessage('All found. You know your way around!');
    }
    setSelected([]); setAnchor(null);
  };
  useEffect(() => {
    const onUp = () => { if (anchor) finish(selected); };
    window.addEventListener('pointerup', onUp);
    return () => window.removeEventListener('pointerup', onUp);
  }, [anchor, selected, found]);

  const reset = () => { setFound([]); setSelected([]); setAnchor(null); setCircles([]); setMessage(''); };
  const navigate = key => { const word = words.find(item => item.key === key); if (foundSet.has(key)) location.hash = word.path; };
  const circleMarkup = (path, index) => {
    if (!path.length || !boardRef.current) return null;
    const first = cellRefs.current[keyOf(path[0])], last = cellRefs.current[keyOf(path[path.length - 1])];
    if (!first || !last) return null;
    const board = boardRef.current.getBoundingClientRect(), a = first.getBoundingClientRect(), b = last.getBoundingClientRect();
    const x1 = a.left - board.left + a.width / 2, y1 = a.top - board.top + a.height / 2;
    const x2 = b.left - board.left + b.width / 2, y2 = b.top - board.top + b.height / 2;
    const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy), cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const rx = length / 2 + a.width * .58, ry = a.width * .34;
    const outlineD = `M ${-rx} 0 C ${-rx * .98} ${-ry * .72}, ${-rx * .62} ${-ry * 1.12}, ${-rx * .08} ${-ry * .96} C ${rx * .58} ${-ry * 1.14}, ${rx * 1.04} ${-ry * .62}, ${rx} ${ry * .04} C ${rx * 1.08} ${ry * .72}, ${rx * .56} ${ry * 1.12}, ${rx * .02} ${ry * .98} C ${-rx * .58} ${ry * 1.12}, ${-rx * 1.04} ${ry * .6}, ${-rx} 0`;
    const transform = `translate(${cx} ${cy}) rotate(${angle})`;
    return <g key={index}>
      <path className="ink-circle" pathLength="1000" d={outlineD} transform={transform} />
      <path className="ink-circle ink-circle-echo" pathLength="1000" d={outlineD} transform={`translate(1 -1) ${transform}`} />
    </g>;
  };

  return <section className="puzzle-section" id="puzzle">
    <div className="contents-rail" aria-hidden="true"><span>CONTENTS</span><i>✦</i></div>
    <div className="puzzle-page">
    <div className="puzzle-head"><p className="hand">A little play for curious minds</p><h2>Find your way<br />through the letters.</h2><p className="puzzle-intro">Drag across the grid to find three little corners of my world. Look across, down, or diagonally.</p><div className="progress"><span>{found.length}</span> / 3 WORDS FOUND <button onClick={reset} className="text-button">Start again ↺</button></div></div>
    <svg className="margin-arrows" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><path d="M390 18 C340 8 320 20 304 49 M304 49 l13 -5 M304 49 l8 12"/><text x="350" y="13">graphic design, collected things</text><path d="M735 515 C780 495 805 500 830 527 M830 527 l-14 -2 M830 527 l-5 -13"/><text x="705" y="540">little moments, kept close</text></svg>
    <div className="puzzle-layout"><div className="board-wrap">
      <div className="board-frame"><div className="board" ref={boardRef} role="grid" aria-label="Word search puzzle">
        {grid.flatMap((row, r) => row.map((letter, c) => {
          const point = [r, c], k = keyOf(point), isFound = circles.some(path => path.some(cell => keyOf(cell) === k));
          return <button key={k} ref={node => { if (node) cellRefs.current[k] = node; }} className={`cell${selectedSet.has(k) ? ' selected' : ''}${isFound ? ' found' : ''}`} type="button" role="gridcell" aria-label={`Row ${r + 1}, column ${c + 1}, ${letter}`} onPointerDown={event => { event.preventDefault(); event.currentTarget.focus(); setAnchor(point); setSelected([point]); }} onPointerEnter={() => { if (anchor) setSelected(cellPath(anchor, point)); }} onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!anchor) { setAnchor(point); setSelected([point]); } else finish(cellPath(anchor, point)); }
            if (anchor && event.key.startsWith('Arrow')) { event.preventDefault(); const [dr, dc] = ({ ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] })[event.key]; const next = [Math.max(0, Math.min(size - 1, selected.at(-1)[0] + dr)), Math.max(0, Math.min(size - 1, selected.at(-1)[1] + dc))]; setSelected(cellPath(anchor, next)); cellRefs.current[keyOf(next)]?.focus(); }
          }}>{letter}</button>;
        }))}
        <svg className="circles" aria-hidden="true" viewBox={`0 0 ${boardRef.current?.clientWidth || 1} ${boardRef.current?.clientHeight || 1}`}>{circles.map(circleMarkup)}</svg>
      </div></div>
    </div><aside className="word-card"><p className="annotation-title">Little things to find <span>✦</span></p><p className="annotation-copy">A few notes from my world. Find them in the grid, then follow the link.</p><ul>{words.map((word, i) => <li key={word.key}><span className="number">0{i + 1}</span><button className={`word-link${foundSet.has(word.key) ? ' done' : ''}`} disabled={!foundSet.has(word.key)} onClick={() => navigate(word.key)}><span>{word.label}</span><small>{foundSet.has(word.key) ? 'FOUND ↗' : 'HIDDEN'}</small></button><em>{['a little about me', 'stories & other thoughts', 'moments kept in frames'][i]}</em></li>)}</ul><p className="success" aria-live="polite">{message}</p></aside></div>
    </div>
  </section>;
}

const pageContent = {
  '#about': ['A little about me', 'Curious by nature. Collector of little details.', 'A scrapbook of the places, people, and ideas that have made their way into my work. This space is waiting for a few stories from me.'],
  '#articles': ['Notes & articles', 'Thoughts, gathered along the way.', 'A small shelf of writing about making things, noticing things, and everything in between. New notes will find their way here soon.'],
};
function Subpage({ content }) {
  return <section className="subpage"><nav className="topbar"><a href="#home" className="micro">CREATIVE ARCHIVE · NO. 01</a><a className="monogram" href="#home">GV</a><a href="#home" className="micro underlined">BACK TO THE ARCHIVE ↗</a></nav><header className="subhead"><p className="hand">A page from my journal</p><h1>{content[0]}</h1><p>{content[1]}</p></header><div className="scrapbook"><div className="paper-photo photo p2"><img src="/hero-image.jpeg" alt="" /><span>AN UNFINISHED COLLECTION</span></div><article className="note"><span className="micro">A NOTE TO SELF</span><h2>{content[1]}</h2><p>{content[2]}</p><a className="back-link" href="#puzzle">← Back to the puzzle</a></article><div className="paper-photo photo p3"><img src="/hero-image.jpeg" alt="" /><span>KEPT WITH CARE</span></div></div></section>;
}

const journalArticles = [
  {
    id: 'reset', title: 'An apple a day', subtitle: 'White coat syndrome, remade for the runway',
    description: 'At The Reset Show, Maria Medina turns the anxieties of a hospital into a striking study in silhouette, memory and material.',
    category: 'FASHION · THE RESET SHOW', author: 'Ada Ashish', cover: '/assets/articles/reset-figure-000.jpg',
    pdf: '/assets/articles/reset-show.pdf', coverAlt: 'A model wearing Maria Medina’s white sculptural look between hospital curtains',
    sections: [
      { heading: '', paragraphs: [
        'White coat syndrome (noun): blood pressure values higher than normal when measured in a medical environment, but within the normal range during daily life. The anxiety of being around doctors in white coats can make your blood pressure rise. (Celis H, Fagard RH, 2004.)',
        'Welcome to The House, to the house of The Reset Show.',
        'The moment one walks through the glass door, past the contemporary dancers, ping pong table and the security at the gateway, an alternate dimension engulfs them. And if it’s December, “a parade of extraordinary clothes... showering scraps of paper, silver foil, a flurry of feathers, a cascade of glitter, like snow onto The Street below, it’s time for Christmas” (Blackman, Davies 2019, p. 224).',
        '“Central Saint Martins is a mini cosmos of its own.” (Coraca 2025)',
      ]},
      { heading: 'A house of ideas', paragraphs: [
        'Central to Central Saint Martins’ ethos is collaboration, sustainability, and most importantly thought-provoking art. David Kappo, a tutor for Fashion Design, aims to get students to “fully explore what they are about without any creative constraints”.',
        'Amongst this creative landscape lies the annual tradition of The Reset Show (formerly known as the White Show), where some of the world’s best and brightest designers are challenged on their ability to think, design, research, and construct. First-year BA design students are given three words which dictate the theme of their garment and are offered around two metres of three white fabrics per student. This year, the lineup consisted of recycled tablecloth and Ultrasuede in two different weights, to represent: artefact, displacement, and 24 hours. This long-standing tradition is fundamental to CSM’s ecological integrity due to its role in shaping fashion students. Quite early on in their academic journey, they are part of a project that spans over the entirety of BA Fashion, with each pathway responsible for a role that brings The Reset Show together.',
        'Maria’s look, titled An apple a day, captures white coat syndrome through an elaborate silhouette—reflective of a hospital room—but also smaller details such as surgical stitches, pleating, and hospital gown knotting. “The fear is not just of doctors but the overall hospital environment, the lighting, nurses, fabrics etc.” Maria cultivated this particular theme by looking at medical tools in cognisance with the word ‘artefact’. She has incorporated contemporary and historical elements of medicine: the curtains mimic hospital bed dividers, and the shoulder details are inspired by the 17th-century plague masks (figure 1).',
      ]},
      { heading: 'Learning through exchange', paragraphs: [
        'Although the students have a preconceived notion of what they might do, the tutorials and interaction with the tutors “develop, change, evolve into something they couldn’t imagine would happen. That’s why they are here, this interaction and involvement,” (Kappo 2025). Saint Martins, with collaboration at its core, creates this space where creatives of different disciplines can learn the importance of each other. Sarah Gresty (2025) states that CSM differs from other design colleges due to this exposure students have early on. This is an important skill which not only teaches students the importance of collaboration but also the various elements that can be taken into consideration when designing.',
        'For instance, Maria puts a great emphasis on her experience in BA Textile, shaping her approach to design. “...kind of like an instinct for me to focus on surface design.” She had a material-led approach when designing her look; for example, the lapel for the coat is shaped using the ‘embossed fusion’ technique she discovered as a textile student, reminiscent of heat-press suction. She layered a piece of Ultrasuede in the shape of the lapel under the shirt to form the shape on the outer layer. This helped her allude to a white coat without axiomatically creating one.',
        'Furthermore, the students are expected to not only demonstrate skill but also a narrative. “We want them to be able to react to different things around immigration, consumerism, ‘Black Lives Matter’, heritage…” (Gresty 2024). Maria incorporated her own Colombian heritage through her choice of references such as Doris Salcedo, a Colombian artist whose Untitled artwork (figure 2) inspired the front layering of the final garment. “My work is a reflection of my personal and cultural heritage. My parents are doctors, and this project is heavily inspired by growing up around the medical field,” says Maria.',
      ]},
      { heading: 'A look with a story', paragraphs: [
        'An apple a day is an interesting look at what the tutors want from their students. As David Kappo stated, “hard work and honesty is what I expect from the students”. Maria demonstrates an excellent level of skill which was validated by her tutors during the crits, but also incorporates elements of who she is. It is not just a project but a representation of what the college nudges its students to do. The Reset Show is a result of Central Saint Martins’ unprecedented environment. One could even say, CSM is the haus of fostering the creatives of tomorrow.',
      ]},
    ],
    figures: [
      { afterSection: 0, src: '/assets/articles/reset-figure-001.jpg', alt: 'A second view of the white sculptural look on the runway', caption: 'Maria Medina’s look, An apple a day, at The Reset Show.' },
      { afterSection: 1, src: '/assets/articles/reset-figure-002.jpg', alt: 'Historical illustration of a plague doctor in protective clothing', caption: 'Figure 1. A 17th-century plague doctor. Encyclopædia Britannica ImageQuest.' },
      { afterSection: 2, src: '/assets/articles/reset-figure-003.jpg', alt: 'Close detail of layered cotton garments', caption: 'Figure 2. Doris Salcedo, Untitled (detail), 1989–90. Cotton shirts, steel and plaster. Museum of Contemporary Art Chicago.' },
    ],
    bibliography: [
      'Blackman C. and Davies H. “The White Show”, in Fashion Central Saint Martins. Thames and Hudson, 2019, p. 224.',
      'Celis H. and Fagard R. H. “White-coat hypertension: a clinical review.” European Journal of Internal Medicine, 2004.',
      'Coraca I. “Reset Show.” Interview by Ada Ashish, Central Saint Martins, 1 December 2025.',
      'Gresty S. “The Reset Show.” Interview by Ada Ashish, 4 December 2025.',
      'Gresty S. “White Show: The gateway to success at Central Saint Martins University of the Arts London.” Interview, Ultrasuede Official, 2024.',
      'Kappo D. “The Reset Show.” Interview by Ada Ashish, Central Saint Martins, 2025.',
      'Medina M. “The Reset Show.” Interview by Ada Ashish, 2025.',
      'Cambridge Dictionary, “Haus”; Urban Dictionary, “Haus”. Accessed 11 December 2025.',
    ],
  },
  {
    id: 'apophenia', title: '‘Apophenia’: The Art of the Psychological State',
    subtitle: 'Leah Clements’ first major solo UK exhibition, an investigation into finding meaning in the experience of disability',
    description: 'A review of an exhibition where film, sound and installation consider disability, healing, spirituality and the stories we make from experience.',
    category: 'ARTS · EXHIBITION REVIEW', author: 'Ada Ashish', cover: null,
    pdf: '/assets/articles/apophenia.pdf',
    sections: [
      { heading: '', paragraphs: [
        'Apophenia by Leah Clements is the newest addition to her catalogue raisonné of exploring disability, healing and spirituality through art. Displayed in the Peer Gallery, the exhibition consists of audio-visuals, installations and film, all with the intention of deconstructing the concept of apophenia.',
        'Apophenia focuses on Jenn Ashworth’s experiences with religion and childbirth, highlighted in her memoir Notes made while falling. In proper Clements fashion, she explores “spiritual suicide” and healing through the concepts of apopheny and epiphany as antonyms. The film was almost an elegy to a version of her life and an encomium to the progress after. What really stood out was the music; it played a prominent role in the narrative. There was something peculiar about the audio choice: it didn’t feel like it was recorded for the purpose of the film, but instead gathered and puzzled together to match the cohesive body of work.',
      ]},
      { heading: 'Entering a sacred space', paragraphs: [
        'There’s an overarching theme of religion, such as the mention of “Eternal progression” and the quote “What happens when you get the holy grail?”, which can be found not only in the film itself, but also in the bottles of holy water atop the doorway to the screening. The positioning feels like you’re entering sacred ground—cleansed of negativity in order to enter the sanctified space.',
        'The glass window at the entrance is decorated with symbols alluding to moments in the film which are properly visible only when the sun seeps through the window. The visual imagery of the sun beaming down, illuminating the symbols, feels adjacent to angels descending from heaven, the golden light of heaven; it’s very godly.',
      ]},
      { heading: 'The viewer becomes part of the work', paragraphs: [
        'The first and last thing that caught my eye were the two chairs placed in the centre, paired with an audio explanation of the gallery. One faces into the gallery, creating an almost claustrophobic feel, while the other faces out a large window, leaving you vulnerable to spectators and encouraging people to isolate from the comfort that passive spectatorship brings.',
        'The seating was described as “common in wellness clinics, spaces used for psychoanalysis, or the hospital sick bed” by Clements. When I asked what people felt like engaging with the art, responses included: “Public setting with the chair, was weird but interesting for me.” “When you sit down, you become a part of the sculpture.”',
      ]},
    ],
    location: 'Peer Gallery, 97–99 Hoxton Street, London N1 6QL.',
  },
];
function ArticlesPage() {
  const featured = journalArticles[0], secondary = journalArticles[1];
  return <main className="journal-page">
    <nav className="topbar"><a href="#home" className="micro">CREATIVE ARCHIVE · NO. 01</a><a className="monogram" href="#home">GV</a><a href="#home" className="micro underlined">BACK TO THE ARCHIVE ↗</a></nav>
    <header className="journal-masthead"><p className="hand">A page from my journal</p><h1>Notes <span>&</span> articles</h1><p className="journal-deck">Thoughts, gathered along the way.</p></header>
    <section className="journal-layout" aria-label="Journal articles">
      <a className="journal-side journal-side-top" href={`#article-${secondary.id}`}>
        <div className="journal-poster journal-poster-small" aria-hidden="true"><span>APOPHENIA</span><i>✳</i><small>LEAH CLEMENTS</small></div>
        <span className="journal-label">{secondary.category}</span><h2>{secondary.title}</h2><p>{secondary.description}</p><span className="journal-meta">BY {secondary.author.toUpperCase()}</span>
      </a>
      <a className="journal-feature" href={`#article-${featured.id}`}>
        <div className="journal-feature-image"><img src={featured.cover} alt={featured.coverAlt} /><span>{featured.category}</span></div>
        <div className="journal-feature-copy"><span className="journal-label">FEATURED STORY&nbsp; / &nbsp;{featured.author.toUpperCase()}</span><h2>{featured.title}</h2><p>{featured.description}</p><span className="journal-meta">{featured.subtitle}</span></div>
      </a>
      <a className="journal-side journal-side-bottom" href={`#article-${featured.id}`}><img src="/assets/articles/reset-figure-001.jpg" alt="Maria Medina’s sculptural white look at The Reset Show" /><span className="journal-label">DETAIL&nbsp; / &nbsp;THE RESET SHOW</span><h2>A silhouette with a story</h2><p>{featured.subtitle}</p><span className="journal-meta">READ THE FEATURE ↗</span></a>
    </section>
    <section className="journal-popular"><div className="journal-section-title"><h2>Articles & reviews</h2><span>{journalArticles.length} PIECES</span></div><div className="popular-grid">{journalArticles.map(article => <a className="popular-entry" href={`#article-${article.id}`} key={article.id}>{article.cover ? <img src={article.cover} alt="" /> : <span className="popular-monogram">A.</span>}<span><b>{article.title}</b><small>{article.category}&nbsp; · &nbsp;{article.author}</small></span><i>↗</i></a>)}</div></section>
    <footer className="journal-footer"><span>GV · PERSONAL ARCHIVE</span><span>NOTES, KEPT WITH CARE</span></footer>
  </main>;
}
function ArticleDetail({ article }) {
  return <main className="journal-page article-page">
    <nav className="topbar"><a href="#home" className="micro">CREATIVE ARCHIVE · NO. 01</a><a className="monogram" href="#home">GV</a><a href="#articles" className="micro underlined">← ALL NOTES</a></nav>
    <article className="reading-page"><header className="reading-heading"><p className="journal-label">{article.category}&nbsp; / &nbsp;THE CREATIVE ARCHIVE</p><h1>{article.title}</h1><p className="reading-deck">{article.subtitle}</p><div className="reading-meta"><span>BY {article.author.toUpperCase()}</span><a href={article.pdf} target="_blank" rel="noreferrer">OPEN ORIGINAL PDF ↗</a></div></header>
      {article.cover ? <figure className="reading-hero"><img src={article.cover} alt={article.coverAlt} /><figcaption>{article.title.toUpperCase()}&nbsp; / &nbsp;THE RESET SHOW</figcaption></figure> : <div className="journal-poster reading-poster" role="img" aria-label="Apophenia, an exhibition review about art, disability and spirituality"><span>APOPHENIA</span><i>✳</i><small>THE ART OF THE<br />PSYCHOLOGICAL STATE</small></div>}
      <div className="reading-copy"><p className="reading-lead">{article.description}</p>{article.sections.map((section, index) => <section className="reading-section" key={`${article.id}-${index}`}>{section.heading && <h2>{section.heading}</h2>}{section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}{article.figures?.filter(figure => figure.afterSection === index).map(figure => <figure className="reading-inline-figure" key={figure.src}><img src={figure.src} alt={figure.alt} /><figcaption>{figure.caption}</figcaption></figure>)}</section>)}{article.location && <p className="reading-location">{article.location}</p>}{article.bibliography && <details className="reading-bibliography"><summary>References & image credits</summary><ol>{article.bibliography.map((reference, index) => <li key={index}>{reference}</li>)}</ol></details>}</div>
      <a className="reading-back" href="#articles">← Return to notes & articles</a>
    </article>
  </main>;
}

const aboutPhotos = [
  { id: 'imag2', alt: 'A fashion look outside a London station', position: '50% 56%' },
  { id: 'imag5', alt: 'A quiet black-and-white moment in a hotel room', position: '50% 57%' },
  { id: 'imag3', alt: 'A close-up portrait with a playful outfit', position: '50% 46%' },
  { id: 'imag8', alt: 'An evening portrait in a warm, book-lined room', position: '52% 42%' },
  { id: 'imag4', alt: 'A bright editorial look in a studio', position: '58% 44%' },
  { id: 'imag7', alt: 'A train journey, with red gloves', position: '54% 50%' },
];
function AboutPage() {
  return <main className="about-page">
    <nav className="topbar"><a href="#home" className="micro">CREATIVE ARCHIVE · NO. 01</a><a className="monogram" href="#home">GV</a><a href="#home" className="micro underlined">BACK TO THE ARCHIVE ↗</a></nav>
    <div className="about-spread">
      <section className="about-intro" aria-labelledby="about-greeting">
        <p className="about-kicker">A PERSONAL INTRODUCTION&nbsp; / &nbsp;LONDON</p>
        <h1 id="about-greeting"><span>hello!</span></h1>
        <div className="about-copy">
          <p>I am a professional in fashion communications and styling with experience in costume design, editorial writing, sales, and cultural research.</p>
          <p>I have the ability to support high-pressure productions such as ballet performances and national beauty pageants while maintaining aesthetic precision.</p>
          <p>Founder of a fashion blog analysing the intersection of history, culture, and consumer behaviour.</p>
          <p>Currently studying at Central Saint Martins, University of the Arts London.</p>
        </div>
        <span className="about-index">01 — ABOUT THE MAKER</span>
      </section>
      <section className="about-visual" aria-label="Personal photographs">
        <div className="about-photo-column about-photo-column-a">
          {aboutPhotos.filter((_, i) => i % 2 === 0).map((photo, i) => <figure className={`about-photo about-photo-a${i + 1}`} key={photo.id}><img src={`/assets/gallery/${photo.id}.jpeg`} alt={photo.alt} loading="lazy" decoding="async" style={{ objectPosition: photo.position }} /></figure>)}
        </div>
        <div className="about-photo-column about-photo-column-b">
          {aboutPhotos.filter((_, i) => i % 2 === 1).map((photo, i) => <figure className={`about-photo about-photo-b${i + 1}`} key={photo.id}><img src={`/assets/gallery/${photo.id}.jpeg`} alt={photo.alt} loading="lazy" decoding="async" style={{ objectPosition: photo.position }} /></figure>)}
        </div>
        <h2 className="about-script" aria-label="about myself"><span>about</span><span>myself</span></h2>
        <p className="about-photo-note">NOTES FROM A LIFE IN PROGRESS&nbsp; ✳</p>
      </section>
    </div>
  </main>;
}

const galleryImages = [
  { id: 'imag1', alt: 'Reading in a vintage library', position: '50% 78%' },
  { id: 'imag2', alt: 'A fashion look outside a London station', position: '50% 56%' },
  { id: 'imag3', alt: 'A close-up portrait with a playful outfit', position: '50% 46%' },
  { id: 'imag4', alt: 'A bright editorial look in a studio', position: '58% 44%' },
  { id: 'imag5', alt: 'A quiet black-and-white moment in a hotel room', position: '50% 57%' },
  { id: 'imag6', alt: 'A bathtub and a book', position: '51% 58%' },
  { id: 'imag7', alt: 'A train journey, with red gloves', position: '54% 50%' },
  { id: 'imag8', alt: 'An evening portrait in a warm, book-lined room', position: '52% 42%' },
];
function GalleryPage() {
  const [active, setActive] = useState(null);
  useEffect(() => {
    if (!active) return undefined;
    const onKeyDown = event => { if (event.key === 'Escape') setActive(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active]);
  return <main className="gallery-page">
    <nav className="topbar"><a href="#home" className="micro">CREATIVE ARCHIVE · NO. 01</a><a className="monogram" href="#home">GV</a><a href="#home" className="micro underlined">BACK TO THE ARCHIVE ↗</a></nav>
    <header className="gallery-heading"><p className="hand">Small frames, kept close</p><h1>Pictures, lately</h1><div className="gallery-deck"><span>AN IMAGE DIARY · 01—08</span><p>Little scenes from here and there,<br />gathered along the way.</p></div></header>
    <div className="gallery-collage" aria-label="Eight photographs in an editorial collage">
      {galleryImages.map((image, index) => <button className={`gallery-tile gallery-tile-${index + 1}`} type="button" key={image.id} onClick={() => setActive(image)} aria-label={`Enlarge photo: ${image.alt}`}>
        <img src={`/assets/gallery/${image.id}.jpeg`} alt={image.alt} loading="lazy" decoding="async" style={{ objectPosition: image.position }} />
      </button>)}
    </div>
    <div className="gallery-foot"><span>GV · PERSONAL ARCHIVE</span><span>MADE OF MOMENTS, NOT MUCH ELSE</span></div>
    {active && <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={active.alt} onClick={() => setActive(null)}>
      <button className="lightbox-close" type="button" onClick={() => setActive(null)} aria-label="Close enlarged photo">×</button>
      <img src={`/assets/gallery/${active.id}.jpeg`} alt={active.alt} onClick={event => event.stopPropagation()} />
      <p>{active.alt}</p>
    </div>}
  </main>;
}
function App() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => { const update = () => setHash(location.hash); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  if (hash === '#pictures') return <GalleryPage />;
  if (hash === '#about') return <AboutPage />;
  if (hash === '#articles') return <ArticlesPage />;
  if (hash === '#article' || hash === '#article-reset') return <ArticleDetail article={journalArticles[0]} />;
  if (hash === '#article-apophenia') return <ArticleDetail article={journalArticles[1]} />;
  return pageContent[hash] ? <Subpage content={pageContent[hash]} /> : <><Hero /><WordSearch /></>;
}

createRoot(document.getElementById('root')).render(<App />);
