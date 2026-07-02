"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9000,
        height: "64px",
        display: "flex",
        alignItems: "center",
        paddingLeft: "24px",
        paddingRight: "72px", // leave room for theme toggle
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-primary)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Wordmark */}
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 300,
          fontSize: "18px",
          color: "var(--text-heading)",
          textDecoration: "none",
          letterSpacing: "-0.01em",
          marginRight: "auto",
        }}
      >
        Yair Golan
      </Link>

      {/* Nav links — centered absolutely so they sit in the middle of the bar */}
      <nav
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "32px",
        }}
      >
        {links.map(({ href, label }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: isActive ? "var(--text-body)" : "var(--text-secondary)",
                textDecoration: "none",
                position: "relative",
                paddingBottom: "2px",
                transition: "color 0.15s",
              }}
            >
              {label}
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "var(--bg-accent)",
                    borderRadius: "1px",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
