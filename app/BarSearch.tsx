"use client";

import { usePathname } from "next/navigation";
import Search from "./Search";

/**
 * The compact lookup lives in the header bar on every page except the home page,
 * where search leads the page itself and a second field would be redundant.
 */
export default function BarSearch() {
  const path = usePathname();
  if (path === "/") return null;
  return <Search compact examples={false} />;
}
