import { redirect } from "next/navigation";

/** This route has been deprecated. All compliance work happens in /command-center. */
export default function DeprecatedPage() {
  redirect("/command-center");
}
