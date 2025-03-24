import { cn } from "@/lib/utils"
import { type HTMLAttributes } from "react"

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
}

export function Container({ className, as: Component = "div", ...props }: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    />
  )
}