import Link from "next/link";

export type InitialIndexItem = { href: string; title: string; meta: string };

// Suspense fallback is included in the first HTML response while the interactive filter loads.
export default function InitialIndexPreview({ title, items }: { title: string; items: InitialIndexItem[] }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-6 sm:px-6" aria-label={title}>
      <h2 className="mb-4 text-lg font-extrabold text-ink">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.href} className="rounded-xl border border-line bg-white p-4">
            <Link href={item.href} className="font-bold text-ink hover:text-free">{item.title}</Link>
            <p className="mt-1 text-sm text-ink-soft">{item.meta}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
