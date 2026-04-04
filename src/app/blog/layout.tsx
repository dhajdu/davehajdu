export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full-width layout — each section within blog pages handles its own container
  return <>{children}</>;
}
