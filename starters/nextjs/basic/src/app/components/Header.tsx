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
        <image src="/logo_white.png"  border="none" height="100%"/>
      </header>
    </>
  );
}
