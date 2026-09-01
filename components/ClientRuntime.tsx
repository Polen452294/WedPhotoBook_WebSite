"use client";

import { Analytics } from "@/components/Analytics";
import { CookieNotice } from "@/components/CookieNotice";
import { OrderDialog } from "@/components/OrderDialog";
import { SiteCodeManager } from "@/components/SiteCodeManager";
import { SiteContentManager } from "@/components/SiteContentManager";

// The homepage uses the small progressive-enhancement script injected by the
// Worker. Keeping this runtime on the routes that need full React behavior
// prevents its shared chunks from becoming part of the mobile homepage path.
export function ClientRuntime() {
  return <><OrderDialog /><CookieNotice /><Analytics /><SiteContentManager /><SiteCodeManager /></>;
}
