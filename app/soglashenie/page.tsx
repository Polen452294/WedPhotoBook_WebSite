import { LegalDocumentPage, legalDocumentMetadata } from "@/components/LegalDocumentPage";

export const metadata = legalDocumentMetadata("consent", "/soglashenie/");

export default function ConsentPage() {
  return <LegalDocumentPage documentKey="consent" />;
}
