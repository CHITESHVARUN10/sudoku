import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import History from "../components/History";
import Facts from "../components/Facts";
import Footer from "../components/Footer";

function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-margin-sm md:px-margin-lg">
        <Hero />
        <History />
        <Facts />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
