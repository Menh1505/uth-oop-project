export function Steps({ items, activeIndex }: { items: string[]; activeIndex: number }) {
  return (
    <div className="steps">
      {items.map((s, i) => (
        <div key={s} className={`step ${i <= activeIndex ? "step-done" : "step-pending"}`}>{s}</div>
      ))}
    </div>
  );
}
