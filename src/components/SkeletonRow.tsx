export default function SkeletonRow() {
  return (
    <article className="track-card track-card--skeleton" aria-hidden>
      <div className="track-card-row">
        <div className="track-card-number">
          <div className="skeleton-bar skeleton-bar--num" />
        </div>
        <div className="skeleton-thumb" />
        <div className="track-card-meta">
          <div className="skeleton-bar skeleton-bar--title" />
          <div className="skeleton-bar skeleton-bar--meta" />
        </div>
        <div className="skeleton-circle" />
      </div>
    </article>
  );
}
