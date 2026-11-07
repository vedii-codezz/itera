export function Button({ children, icon: Icon, variant = "", ...props }) {
  return (
    <button className={`button ${variant}`} {...props}>
      {Icon && <Icon size={16} aria-hidden="true" />}
      {children}
    </button>
  );
}
export function Panel({ title, eyebrow, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-heading">
        <h2>{title}</h2>
        {eyebrow && <span className="mono muted">{eyebrow}</span>}
      </header>
      {children}
    </section>
  );
}
