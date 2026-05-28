"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Arrow } from "./Arrow";
import { Firebase } from "./Firebase";

export function Header() {
  const pathname = usePathname();

  return (
    <>
      {pathname !== "/" && (
        <Link className="button back-button" href="/">
          <Arrow /> Back to home
        </Link>
      )}

      <header className="header">
        <div style="position: absolute;top: -6vh;left: -45vw;height: 30vh;">
          <img src="/logo.png" border="none" height="100%">
        </div>
      </header>
    </>
  );
}
