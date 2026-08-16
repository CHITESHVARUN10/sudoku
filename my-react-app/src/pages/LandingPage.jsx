import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import History from "../components/History";
import Facts from "../components/Facts";
import Footer from "../components/Footer";
import useReducedMotion from "../components/three/useReducedMotion";
import { GridLattice } from "../components/three/lazy";

function LandingPage() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Full-bleed lattice backdrop — very low opacity, behind everything. */}
      <GridLattice
        reducedMotion={reducedMotion}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.12 }}
      />
      <div className="relative z-10">
        <Navbar />
      </div>
      <main className="flex-grow w-full max-w-7xl mx-auto px-margin-sm md:px-margin-lg relative z-10">
        <Hero />
        <History />
        <Facts />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}

export default LandingPage;
