import Link from "next/link";

export default function NotFound() {
  return (
    <main className="state-page">
      <p className="eyebrow">404</p>
      <h1>This entry is not public</h1>
      <p>It may be a draft, unpublished, deleted, or the address may be incorrect.</p>
      <Link className="button" href="/">Return to the account</Link>
    </main>
  );
}
