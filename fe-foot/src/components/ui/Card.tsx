import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export default function Card({ title, children, footer, className }: CardProps) {
  return (
    <section className={["card", className].filter(Boolean).join(" ")}>
      {title && <h2 className="card-title">{title}</h2>}
      <div>{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </section>
  );
}
