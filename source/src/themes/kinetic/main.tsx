import './kinetic.css'; /* first, so inner.css (imported by Inner) comes after it and its overrides win */
import { createRoot } from 'react-dom/client';
import App from './App';
import Inner from './Inner';
import { isPage, setPage } from '../../shared/inner';

/* index.html renders the homepage; about.html, calendar.html … carry <body data-page="…">. */
const page = document.body.dataset.page;
if (isPage(page)) setPage(page);
createRoot(document.getElementById('root')!).render(isPage(page) ? <Inner page={page} /> : <App />);
