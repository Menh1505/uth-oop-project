export default function Card({ title, children, footer }: { title?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <section className="card">
      {title && <h2 className="card-title">{title}</h2>}
      <div>{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </section>
  );
}
