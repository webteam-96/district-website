import { useCallback, useEffect, useRef, useState } from 'react';
import { R } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import PdfModal, { type PdfDoc } from '../../shared/PdfModal';
import { Header, TopStrip } from './Chrome';
import Hero from './Hero';
import { About, Dignitaries, Snapshot } from './Sections';
import Calendar from './Calendar';
import Press from './Press';
import Footer from './Footer';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';
import { isH, useReveal, useSidePage } from './motion';

const IDS = ['top', 'about', 'snapshot', 'dignitaries', 'calendar', 'press', 'contact'];

export default function App() {
  const [year, setYear] = useState(R.years.current);
  const [switching, setSwitching] = useState(false);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const timer = useRef(0);

  useReveal();
  useSidePage(IDS);
  useEffect(() => {
    startSmoothScroll(isH() ? { orientation: 'horizontal', gestureOrientation: 'both', anchors: { offset: 0 }, allowNestedScroll: true } : { anchors: { offset: -72 }, allowNestedScroll: true });
  }, []);
  useEffect(() => { saveTheme(theme); }, [theme]);

  const changeYear = useCallback((y: string) => {
    setYear(y);
    setSwitching(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSwitching(false), 420);
  }, []);
  const toggleTheme = useCallback(() => setTheme(t => (t === 'light' ? 'dark' : 'light')), []);
  const closeDoc = useCallback(() => setDoc(null), []);

  return (
    <ThemeCtx.Provider value={theme}>
      <div className="chrome">
        <TopStrip year={year} onYear={changeYear} theme={theme} onTheme={toggleTheme} />
        <Header />
      </div>
      <div className="line">
        <main id="main">
          <Hero />
          <About />
          <Snapshot year={year} />
          <Dignitaries year={year} switching={switching} />
          <Calendar />
          <Press year={year} switching={switching} onPreview={setDoc} />
        </main>
        <Footer />
      </div>
      <PdfModal doc={doc} onClose={closeDoc} className="pdf--transit" />
    </ThemeCtx.Provider>
  );
}
