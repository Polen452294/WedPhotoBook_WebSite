import { LegalDocumentPage, legalDocumentMetadata } from "@/components/LegalDocumentPage";

export const metadata = legalDocumentMetadata("terms", "/polzovatelskoe-soglashenie/");

export default function TermsPage() {
  return <LegalDocumentPage documentKey="terms" />;
}
