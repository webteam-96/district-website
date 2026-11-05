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
import { useStack } from './motion';

export default function App() {
  const [year, setYear] = useState(R.years.current);
  const [switching, setSwitching] = useState(false);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const timer = useRef(0);

  useStack();
  useEffect(() => { startSmoothScroll({ allowNestedScroll: true }); }, []);
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
      <TopStrip year={year} onYear={changeYear} theme={theme} onTheme={toggleTheme} />
      <Header />
      <main id="main" className="stack">
        <Hero />
        <About />
        <Snapshot year={year} />
        <Dignitaries year={year} switching={switching} />
        <Calendar />
        <Press year={year} switching={switching} onPreview={setDoc} />
        <Footer />
      </main>
      <PdfModal doc={doc} onClose={closeDoc} className="pdf--cascade" />
    </ThemeCtx.Provider>
  );
}
