import { L as Link } from '@/components/L';

export const metadata = { title: 'Page not found' };

/**
 * Rendered inside the root layout, so no <html>/<body> here - and outside the
 * (site) group, so it carries its own minimal chrome rather than the nav.
 */
export default function NotFound() {
  return (
    <div className="shell nf">
      <div>
        <span className="eyebrow" style={{ color: 'var(--magenta)' }}>
          404
        </span>
        <h1>
          Halaman tidak dijumpai <span className="serif-i">/ Page not found</span>
        </h1>
        <p>
          Halaman yang anda cari tidak wujud atau telah dialihkan. &mdash; The page you are
          looking for does not exist or has moved.
        </p>
        <Link className="btn btn-solid" href="/">
          <span>Kembali ke laman utama</span> <span className="arw">&#8594;</span>
        </Link>
      </div>
    </div>
  );
}
