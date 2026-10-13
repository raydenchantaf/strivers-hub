import '../globals.css';

export const metadata = { title: "Studio | Strivers' Hub", robots: { index: false } };

/**
 * The Studio is its own root: it sits outside the locale segment, so it
 * cannot inherit the site's root layout, and it brings its own chrome rather
 * than the site's nav and footer.
 */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
