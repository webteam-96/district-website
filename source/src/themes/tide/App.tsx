import { useCallback, useEffect, useRef, useState } from 'react';
import { R } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import PdfModal, { type PdfDoc } from '../../shared/PdfModal';
import ClickSpark from '../../rb/ClickSpark/ClickSpark';
import { Header, TopStrip } from './Chrome';
import Hero from './Hero';
import { About, Dignitaries, Snapshot } from './Sections';
import Calendar from './Calendar';
import Press from './Press';
import Footer from './Footer';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';
import { useReveal } from './reveal';

export default function App() {
  const [year, setYear] = useState(R.years.current);
  const [switching, setSwitching] = useState(false);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const timer = useRef(0);

  useReveal();
  useEffect(() => { startSmoothScroll(); }, []);
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
      <ClickSpark sparkColor={['#00ADBB', '#D41367', '#0067C8', '#F7A81B']} sparkCount={9} sparkRadius={24} sparkSize={10} duration={500} glow={0.4}>
        <TopStrip year={year} onYear={changeYear} theme={theme} onTheme={toggleTheme} />
        <Header />
        <main id="main">
          <Hero />
          <About />
          <Snapshot year={year} />
          <Dignitaries year={year} switching={switching} />
          <Calendar />
          <Press year={year} switching={switching} onPreview={setDoc} />
        </main>
        <Footer />
        <PdfModal doc={doc} onClose={closeDoc} className="pdf--tide" />
      </ClickSpark>
    </ThemeCtx.Provider>
  );
}
