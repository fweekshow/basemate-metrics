import { permanentRedirect } from "next/navigation";

// Marketing now lives at the root of basemate.app. Keep /landing as a permanent
// alias so old links resolve. On host-split hosts the middleware handles this
// first; this covers localhost and any host the middleware skips.
export default function LandingPage() {
  permanentRedirect("/");
}
