import { useCallback, useEffect, useRef, useState } from 'react';
import { R } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import PdfModal, { type PdfDoc } from '../../shared/PdfModal';
import ClickSpark from '../../rb/ClickSpark/ClickSpark';
import { Header, TopStrip } from './Chrome';
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
  const timer = useRef(0);

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
      <ClickSpark sparkColor={['#F7A81B', '#0067C8', '#D41367', '#00ADBB']} sparkCount={9} sparkRadius={24} sparkSize={10} duration={500} glow={0.4}>
        <TopStrip year={year} onYear={changeYear} theme={theme} onTheme={toggleTheme} />
        <Header />
        <main id="main">
          <Hero />
          <Snapshot year={year} />
          <Dignitaries year={year} switching={switching} />
          <Calendar />
          <Press year={year} switching={switching} onPreview={setDoc} />
        </main>
        <Footer />
        <PdfModal doc={doc} onClose={closeDoc} className="pdf--prism" />
      </ClickSpark>
    </ThemeCtx.Provider>
  );
}
