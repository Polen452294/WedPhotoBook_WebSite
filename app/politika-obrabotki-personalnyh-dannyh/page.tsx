import { LegalDocumentPage, legalDocumentMetadata } from "@/components/LegalDocumentPage";

export const metadata = legalDocumentMetadata("privacy", "/politika-obrabotki-personalnyh-dannyh/");

export default function PrivacyPolicyPage() {
  return <LegalDocumentPage documentKey="privacy" />;
}
