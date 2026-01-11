import Navbar from "@/components/navbar";
import { ModeToggle } from "@/components/mode-toggle";
import Hero from "@/components/hero";
import Features from "@/components/features";
import FAQ from "@/components/faq";
import Footer from "@/components/footer";

export default function Page() {
return <div className="relative h-screen">
  <Navbar />
  <Hero />
  <Features />
  <FAQ />
  <Footer />
  <ModeToggle />
</div>;
}