"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[color:var(--card)] group-[.toaster]:border group-[.toaster]:border-[color:var(--border)] group-[.toaster]:shadow-lg group-[.toaster]:text-white",
          description: "group-[.toast]:text-[color:var(--text-secondary)]",
          actionButton: "group-[.toast]:bg-neutral-800 group-[.toast]:text-white group-[.toast]:border group-[.toast]:border-neutral-700 hover:group-[.toast]:bg-neutral-900",
          cancelButton: "group-[.toast]:bg-transparent group-[.toast]:text-neutral-300 group-[.toast]:border group-[.toast]:border-neutral-700 hover:group-[.toast]:bg-neutral-900/40",
          success: "group-[.toast]:bg-[hsl(160_20%_50%_/_0.12)] group-[.toast]:border-[hsl(160_20%_50%_/_0.25)] group-[.toast]:text-[hsl(160_15%_82%)]",
          warning: "group-[.toast]:bg-[hsl(45_25%_55%_/_0.12)] group-[.toast]:border-[hsl(45_25%_55%_/_0.25)] group-[.toast]:text-[hsl(45_20%_88%)]",
          error: "group-[.toast]:bg-[hsl(350_25%_55%_/_0.12)] group-[.toast]:border-[hsl(350_25%_55%_/_0.25)] group-[.toast]:text-[hsl(350_20%_90%)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
