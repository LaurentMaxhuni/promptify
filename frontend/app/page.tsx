import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Features from "@/components/features";
import FAQ from "@/components/faq";
import Footer from "@/components/footer";

export default function Page() {
  return (
    <main className="overflow-x-hidden w-full max-w-full">
      <Navbar />
      <Hero />
      <Features />
      <FAQ />
      <Footer />
    </main>
  );
}
