import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './styles/site.css'; // custom CSS loads AFTER Tailwind preflight so it wins
import { TenantProvider } from './tenant/TenantProvider';
import App from './App';

// No StrictMode: the ported page effects (data-load bursts + the vendored WebGL
// gallery mounts) run once in the vanilla ASPX. StrictMode's dev-only double-
// invoke doubles the first-paint request burst and remounts the WebGL canvases,
// which is both unfaithful and flaky. Prod is unaffected (StrictMode is dev-only).
ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename="/default">
    <TenantProvider>
      <App />
    </TenantProvider>
  </BrowserRouter>,
);
