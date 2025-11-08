export default function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const { className = "", variant = "primary", ...rest } = props;
  const styles =
    variant === "primary" ? "btn btn-primary" :
    variant === "danger" ? "btn btn-danger" :
    "btn btn-ghost";
  return <button className={`${styles} ${className}`} {...rest} />;
}
