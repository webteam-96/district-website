import './cascade.css';
import { createRoot } from 'react-dom/client';
import App from './App';
import Inner from './Inner';
import { isPage, setPage } from '../../shared/inner';
import { loadLive } from '../../shared/live';

/* index.html renders the homepage; about.html, calendar.html … carry <body data-page="…">.
   cascade.css comes first so inner.css (imported by Inner) can override it. */
const page = document.body.dataset.page;
if (isPage(page)) setPage(page);
/* On this computer the live district data is filled in first (shared/live.ts); anywhere else the sample shows at once. */
loadLive(isPage(page) ? page : 'home').then(() =>
  createRoot(document.getElementById('root')!).render(isPage(page) ? <Inner page={page} /> : <App />));
