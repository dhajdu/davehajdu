import Hero from "@/components/Hero";
import About from "@/components/About";
import Speaking from "@/components/Speaking";
import Books from "@/components/Books";
import BlogPreview from "@/components/BlogPreview";
import ContactCTA from "@/components/ContactCTA";

// The latest posts come from the database; refresh hourly.
export const revalidate = 3600;

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Speaking />
      <Books />
      <BlogPreview />
      <ContactCTA />
    </>
  );
}
