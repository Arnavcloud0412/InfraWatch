"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="panel">
      <h1>This view could not be loaded</h1>
      <p className="prose">{error.message}</p>
      <button type="button" onClick={reset}>Try again</button>
    </div>
  );
}
