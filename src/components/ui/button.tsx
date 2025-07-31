import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline"
}

function Button({ className = "", variant = "default", ...props }: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background px-4 py-2"
  
  const variantClasses = {
    default: "bg-red-600 text-white hover:bg-red-700",
    ghost: "hover:bg-gray-700 hover:text-white",
    outline: "border border-gray-600 hover:bg-gray-700 hover:text-white",
  }
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`
  
  return (
    <button className={classes} {...props} />
  )
}

export { Button }
