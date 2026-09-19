import { LegalDocumentPage, legalDocumentMetadata } from "@/components/LegalDocumentPage";

export const metadata = legalDocumentMetadata("offer", "/oferta/");

export default function OfferPage() {
  return <LegalDocumentPage documentKey="offer" />;
}
