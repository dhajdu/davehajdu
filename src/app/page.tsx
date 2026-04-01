import Hero from "@/components/Hero";
import StatStrip from "@/components/StatStrip";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import Speaking from "@/components/Speaking";
import Expertise from "@/components/Expertise";
import Projects from "@/components/Projects";
import BlogPreview from "@/components/BlogPreview";
import Community from "@/components/Community";
import ContactCTA from "@/components/ContactCTA";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <>
      <Hero />

      <ScrollReveal>
        <StatStrip />
      </ScrollReveal>

      <ScrollReveal>
        <About />
      </ScrollReveal>

      <ScrollReveal>
        <Testimonials />
      </ScrollReveal>

      <ScrollReveal>
        <Speaking />
      </ScrollReveal>

      <ScrollReveal>
        <Expertise />
      </ScrollReveal>

      <ScrollReveal>
        <Projects />
      </ScrollReveal>

      <ScrollReveal>
        <BlogPreview />
      </ScrollReveal>

      <ScrollReveal>
        <Community />
      </ScrollReveal>

      <ScrollReveal>
        <ContactCTA />
      </ScrollReveal>
    </>
  );
}
