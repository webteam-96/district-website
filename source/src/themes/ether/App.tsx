import { useCallback, useEffect, useRef, useState } from 'react';
import { R } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import PdfModal, { type PdfDoc } from '../../shared/PdfModal';
import ClickSpark from '../../rb/ClickSpark/ClickSpark';
import { Header, Preloader, UtilityBar } from './Chrome';
import Hero from './Hero';
import { Dignitaries, Snapshot } from './Sections';
import Calendar from './Calendar';
import Press from './Press';
import Footer from './Footer';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';

export default function App() {
  const [year, setYear] = useState(R.years.current);
  const [switching, setSwitching] = useState(false);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => { saveTheme(theme); }, [theme]);
  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), []);
  const timer = useRef(0);

  useEffect(() => {
    startSmoothScroll();
  }, []);

  /* Year switch: a short skeleton beat, then every year-bound section re-enters.
     Rapid switching resolves to the last choice. */
  const changeYear = useCallback((y: string) => {
    setYear(y);
    setSwitching(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSwitching(false), 420);
  }, []);

  const closeDoc = useCallback(() => setDoc(null), []);

  return (
    <ThemeCtx.Provider value={theme}>
    <ClickSpark sparkColor={theme === 'light' ? ['#F7A81B', '#0067C8', '#FF5C93'] : ['#F7A81B', '#36B3FF', '#FFFFFF']} sparkCount={10} sparkRadius={26} sparkSize={11} duration={520} glow={0.6}>
      <Preloader />
      <UtilityBar year={year} onYear={changeYear} theme={theme} onTheme={toggleTheme} />
      <Header />
      <main id="main">
        <Hero />
        <Snapshot year={year} />
        <Dignitaries year={year} switching={switching} />
        <Calendar />
        <Press year={year} switching={switching} onPreview={setDoc} />
      </main>
      <Footer />
      <PdfModal doc={doc} onClose={closeDoc} />
    </ClickSpark>
    </ThemeCtx.Provider>
  );
}
