import { redirect } from "next/navigation";

/** Waitlist retired — product is live. */
export default function WaitlistPage() {
  redirect("/landing#start");
}
