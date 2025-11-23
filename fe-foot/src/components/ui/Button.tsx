interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export default function Button(props: ButtonProps) {
  const { className = "", variant = "primary", size = "md", ...rest } = props;
  
  const variantStyles =
    variant === "primary" ? "btn btn-primary" :
    variant === "danger" ? "btn btn-danger" :
    variant === "outline" ? "btn btn-outline" :
    "btn btn-ghost";
    
  const sizeStyles = 
    size === "sm" ? "px-3 py-1.5 text-sm" :
    size === "lg" ? "px-6 py-3 text-lg" :
    "";
  
  return <button className={`${variantStyles} ${sizeStyles} ${className}`} {...rest} />;
}
