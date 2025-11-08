export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return <select className={`select ${className}`} {...rest}>{children}</select>;
}
