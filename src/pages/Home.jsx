import Hero from '../components/Hero.jsx';
import SeasonStrip from '../components/SeasonStrip.jsx';
import Packages from '../components/Packages.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import Gallery from '../components/Gallery.jsx';
import Reviews from '../components/Reviews.jsx';
import ServiceArea from '../components/ServiceArea.jsx';
import FAQ from '../components/FAQ.jsx';
import FinalCTA from '../components/FinalCTA.jsx';

// Section order for THIS site (unique layout):
// Hero → Season countdown → Tabbed packages → How it works → Day/Night gallery
// → Reviews → Service area → FAQ → Final CTA
export default function Home() {
  return (
    <main>
      <Hero />
      <SeasonStrip />
      <Packages />
      <HowItWorks />
      <Gallery />
      <Reviews />
      <ServiceArea />
      <FAQ />
      <FinalCTA />
    </main>
  );
}
