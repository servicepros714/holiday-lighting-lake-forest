import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import FunnelHeader from './components/FunnelHeader.jsx';
import Footer from './components/Footer.jsx';
import MobileActionBar from './components/MobileActionBar.jsx';
import Home from './pages/Home.jsx';
import Book from './pages/Book.jsx';
import Checkout from './pages/Checkout.jsx';
import Confirmation from './pages/Confirmation.jsx';

const FUNNEL = ['/book', '/checkout', '/confirmation'];

/** Scroll to top on every route change; honour #hash links to homepage sections. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      let tries = 0;
      const tick = () => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else if (tries++ < 10) setTimeout(tick, 50);
      };
      tick();
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const funnel = FUNNEL.includes(pathname);

  return (
    <>
      <ScrollManager />
      {funnel ? <FunnelHeader /> : <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book" element={<Book />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!funnel && <Footer />}
      {/* Hidden on /book, /checkout and /confirmation */}
      {!funnel && <MobileActionBar />}
    </>
  );
}
