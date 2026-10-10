"use client"

import * as P from "@phosphor-icons/react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// Each kind gets its own icon in a tinted tile; colours live in polish.css
// (.toast-*) so both palettes and dark mode stay in step.
const tile = (Icon: P.Icon, weight: P.IconWeight = "fill", spin = false) => (
  <span className="toast-tile" aria-hidden>
    <Icon size={18} weight={weight} className={spin ? "animate-spin" : undefined} />
  </span>
)

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      gap={10}
      icons={{
        success: tile(P.CheckCircle),
        info: tile(P.Info),
        warning: tile(P.WarningDiamond),
        error: tile(P.XCircle),
        loading: tile(P.CircleNotch, "bold", true),
        close: <P.X size={12} weight="bold" />,
      }}
      toastOptions={{
        classNames: {
          toast: "toast-card",
          title: "toast-title",
          description: "toast-desc",
          actionButton: "toast-action",
          cancelButton: "toast-cancel",
          closeButton: "toast-close",
          icon: "toast-icon",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
