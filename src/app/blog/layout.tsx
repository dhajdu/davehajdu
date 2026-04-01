export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-[880px] mx-auto px-8 max-md:px-5 py-16 md:py-24">
      {children}
    </div>
  );
}
