import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="intro">
      <h1>Not found</h1>
      <p className="notice">That page or title does not exist.</p>
      <p>
        <Link href="/">Back to trending</Link>
      </p>
    </section>
  );
}
