import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * ─── BUTTON FACTORY ────────────────────────────────────────────────────────
 *
 * 10 variants, each with a specific emotional / functional purpose.
 * All colours are driven by Tailwind's named scale — update here to retheme.
 *
 * VARIANTS
 *   enroll      Primary CTA — form submits, enrollment, course sign-up
 *   hero        Landing hero — the first button a visitor sees on a page
 *   progress    Soft continuation — next lesson, continue, save draft
 *   secondary   Outline — learn more, view curriculum, back
 *   ghost       Dismiss / toolbar — cancel, icon buttons, low-weight actions
 *   achievement Pill — badge claims, certificate downloads
 *   premium     Gradient — upgrade, unlock, go pro
 *   complete    Completion — submit quiz, finish lesson, mark done
 *   danger      Destructive — delete, remove, irreversible actions
 *   utility     Compact toolbar — table row actions, inline controls (use compact size)
 *
 * SIZES
 *   compact     h-10   — toolbar / utility (pair with utility variant)
 *   default     h-[52px] — standard forms and actions
 *   lg          h-[56px] — prominent standalone CTAs
 *   hero        h-[58px] — hero / marketing full-bleed CTAs
 *   icon        40×40  — icon-only buttons
 *
 * ICON USAGE
 *   Place icon before or after text as a child — gap-2.5 + size-5 handles layout.
 *   <Button variant="enroll"><BookOpen /> Enroll Now</Button>
 *   <Button variant="enroll">Continue <ArrowRight /></Button>
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-semibold transition-all duration-200 select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97]",
  {
    variants: {
      variant: {
        /**
         * enroll — Primary CTA. Deep authoritative indigo.
         * Use for: login, register, enroll, save changes, confirm.
         */
        enroll:
          "rounded-4xl bg-indigo-800 text-white shadow-[0_2px_8px_rgba(55,48,163,0.25)] hover:bg-indigo-900 hover:shadow-[0_6px_20px_rgba(55,48,163,0.35)] focus-visible:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600",

        /**
         * hero — Landing hero CTA. Vibrant, inviting.
         * Use for: hero sections, first-impression CTAs, "Get started".
         */
        hero: "rounded-full bg-indigo-600 text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:bg-indigo-700 hover:shadow-[0_8px_28px_rgba(99,102,241,0.45)] focus-visible:ring-indigo-400 dark:bg-indigo-500 dark:hover:bg-indigo-600",

        /**
         * progress — Soft tint. Encouraging, low-pressure.
         * Use for: next lesson, continue, save draft, skip.
         */
        progress:
          "rounded-3xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 focus-visible:ring-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900 dark:hover:text-indigo-100",

        /**
         * secondary — Outline. Supporting action, no visual dominance.
         * Use for: learn more, view curriculum, back, cancel in forms.
         */
        secondary:
          "rounded-3xl border-2 border-indigo-200 bg-transparent text-indigo-800 hover:border-indigo-400 hover:bg-indigo-50 focus-visible:ring-indigo-300 dark:border-indigo-800 dark:text-indigo-300 dark:hover:border-indigo-600 dark:hover:bg-indigo-950",

        /**
         * ghost — No background. Absolute minimum visual weight.
         * Use for: dismiss, cancel dialogs, toolbar icons, nav icons.
         */
        ghost:
          "rounded-3xl bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-border",

        /**
         * achievement — Amber pill. Celebratory, reward-tone.
         * Use for: claim badge, download certificate, unlocked reward.
         */
        achievement:
          "rounded-full border border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 focus-visible:ring-amber-300 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900",

        /**
         * premium — Violet-indigo gradient. Aspirational, exclusive.
         * Use for: upgrade plan, unlock full course, go pro.
         */
        premium:
          "rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:from-violet-700 hover:to-indigo-700 hover:shadow-[0_8px_28px_rgba(124,58,237,0.45)] focus-visible:ring-violet-400",

        /**
         * complete — Emerald. Positive completion signal.
         * Use for: submit quiz, finish lesson, mark complete, confirm done.
         */
        complete:
          "rounded-4xl bg-emerald-600 text-white shadow-[0_2px_8px_rgba(5,150,105,0.25)] hover:bg-emerald-700 hover:shadow-[0_6px_20px_rgba(5,150,105,0.35)] focus-visible:ring-emerald-400 dark:bg-emerald-700 dark:hover:bg-emerald-600",

        /**
         * danger — Red. Destructive, irreversible.
         * Use for: delete account, remove course, permanent actions.
         */
        danger:
          "rounded-3xl bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-[0_4px_12px_rgba(220,38,38,0.35)] focus-visible:ring-red-400",

        /**
         * utility — Muted. Zero visual noise. Pair with size="compact" only.
         * Use for: table row actions, inline controls, secondary toolbar buttons.
         */
        utility:
          "rounded-3xl bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-border",

        /** Text link — inline, underline on hover. */
        link: "text-indigo-700 underline-offset-4 hover:underline dark:text-indigo-400",
      },
      size: {
        /** Toolbar / table actions — pair with utility variant */
        compact: "h-10 px-4 text-sm gap-2 has-[>svg]:px-3",
        /** Standard forms and actions */
        default: "h-[52px] px-8 text-base has-[>svg]:px-6",
        /** Prominent standalone CTAs */
        lg: "h-[56px] px-10 text-base has-[>svg]:px-8",
        /** Hero / marketing full-bleed CTAs */
        hero: "h-[58px] px-12 text-lg has-[>svg]:px-10",
        /** Icon-only — no text */
        icon: "size-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "enroll",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
