"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";

type BackButtonProps = {
  variant?: "back" | "exit";
  label?: string;
  className?: string;
};

export default function BackButton({
  variant = "back",
  label,
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  const Icon = variant === "exit" ? LogOut : ArrowLeft;
  const text = label ?? (variant === "exit" ? "Exit" : "Back");

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={[
        "inline-flex items-center gap-2",
        "rounded-2xl",
        "border border-emerald-600/25",
        "bg-emerald-600/12",
        "px-4 py-2.5",
        "text-sm font-semibold text-emerald-950",
        "shadow-sm shadow-emerald-900/10",
        "backdrop-blur",
        "hover:bg-emerald-600/18",
        "active:translate-y-[1px]",
        "focus:outline-none focus:ring-2 focus:ring-emerald-400/35",
        className,
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {text}
    </button>
  );
}
