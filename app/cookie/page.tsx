import { LegalDocumentPage, legalDocumentMetadata } from "@/components/LegalDocumentPage";

export const metadata = legalDocumentMetadata("cookie", "/cookie/");

export default function CookiePolicyPage() {
  return <LegalDocumentPage documentKey="cookie" />;
}
