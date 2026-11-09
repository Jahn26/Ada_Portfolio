import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../style.css';

const words = [
  { key: 'ABOUTME', label: 'ABOUT ME', path: '#about', start: [1, 1], delta: [0, 1] },
  { key: 'ARTICLES', label: 'ARTICLES', path: '#articles', start: [2, 1], delta: [1, 0] },
  { key: 'PICTURES', label: 'PICTURES', path: '#pictures', start: [0, 10], delta: [1, -1] },
];
const size = 12;
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
    return <ellipse key={index} className="ink-circle" cx={cx} cy={cy} rx={length / 2 + a.width * .55} ry={a.width * .38} transform={`rotate(${angle} ${cx} ${cy})`} />;
  };

  return <section className="puzzle-section" id="puzzle">
    <div className="puzzle-head"><p className="hand">Go on, have a little play</p><h2>A little puzzle<br />about me.</h2><p className="puzzle-intro">Drag across the letters to find three hidden corners of my world. Words can run forwards, backwards, down, or diagonally.</p></div>
    <div className="puzzle-layout"><div className="board-wrap"><div className="progress"><span>{found.length}</span> OF 3 WORDS FOUND <button onClick={reset} className="text-button">Reset puzzle</button></div>
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
    </div><aside className="word-card"><h3>Find the words <span>✦ <i>no peeking</i> ✦</span></h3><p>Find all three hidden words. Look across, down or diagonally.</p><ul>{words.map((word, i) => <li key={word.key}><span className="number">0{i + 1}</span><button className={`word-link${foundSet.has(word.key) ? ' done' : ''}`} disabled={!foundSet.has(word.key)} onClick={() => navigate(word.key)}><span>{word.label}</span><small>{foundSet.has(word.key) ? 'FOUND · OPEN' : 'HIDDEN'}</small></button></li>)}</ul><p className="success" aria-live="polite">{message}</p></aside></div>
  </section>;
}

const pageContent = {
  '#about': ['A little about me', 'Curious by nature. Collector of little details.', 'A scrapbook of the places, people, and ideas that have made their way into my work. This space is waiting for a few stories from me.'],
  '#articles': ['Notes & articles', 'Thoughts, gathered along the way.', 'A small shelf of writing about making things, noticing things, and everything in between. New notes will find their way here soon.'],
  '#pictures': ['Pictures, lately', 'Small frames from a curious life.', 'A visual diary in progress. Photographs and little moments will live here when they are ready to be shared.'],
};
function Subpage({ content }) {
  return <section className="subpage"><nav className="topbar"><a href="#home" className="micro">CREATIVE ARCHIVE · NO. 01</a><a className="monogram" href="#home">GV</a><a href="#home" className="micro underlined">BACK TO THE ARCHIVE ↗</a></nav><header className="subhead"><p className="hand">A page from my journal</p><h1>{content[0]}</h1><p>{content[1]}</p></header><div className="scrapbook"><div className="paper-photo photo p2"><img src="/hero-image.jpeg" alt="" /><span>AN UNFINISHED COLLECTION</span></div><article className="note"><span className="micro">A NOTE TO SELF</span><h2>{content[1]}</h2><p>{content[2]}</p><a className="back-link" href="#puzzle">← Back to the puzzle</a></article><div className="paper-photo photo p3"><img src="/hero-image.jpeg" alt="" /><span>KEPT WITH CARE</span></div></div></section>;
}
function App() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => { const update = () => setHash(location.hash); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  return pageContent[hash] ? <Subpage content={pageContent[hash]} /> : <><Hero /><WordSearch /></>;
}

createRoot(document.getElementById('root')).render(<App />);
