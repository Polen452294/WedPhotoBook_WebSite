import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "scripts" / "local-mailer" / "mail_gateway.py"
SPEC = importlib.util.spec_from_file_location("mail_gateway", MODULE_PATH)
mail_gateway = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(mail_gateway)


class MailGatewayTests(unittest.TestCase):
    def test_mailbox_validation_rejects_header_injection(self):
        self.assertEqual(
            mail_gateway.mailbox("Wedfotobook <orders@fotobooktest24.ru>"),
            ("Wedfotobook", "orders@fotobooktest24.ru"),
        )
        self.assertEqual(
            mail_gateway.mailbox("orders@fotobooktest24.ru\nBcc: attacker@example.com"),
            ("", ""),
        )

    def test_delivery_claim_is_idempotent(self):
        with tempfile.TemporaryDirectory() as directory:
            mail_gateway.STATE_PATH = str(Path(directory) / "state.sqlite3")
            mail_gateway.initialize_state()
            delivery_id = "contact-notification/test-12345"

            self.assertEqual(mail_gateway.claim_delivery(delivery_id), "claimed")
            self.assertEqual(mail_gateway.claim_delivery(delivery_id), "busy")
            mail_gateway.finish_delivery(delivery_id, accepted=True)
            self.assertEqual(mail_gateway.claim_delivery(delivery_id), "duplicate")

    def test_failed_delivery_can_be_retried(self):
        with tempfile.TemporaryDirectory() as directory:
            mail_gateway.STATE_PATH = str(Path(directory) / "state.sqlite3")
            mail_gateway.initialize_state()
            delivery_id = "contact-notification/test-67890"

            self.assertEqual(mail_gateway.claim_delivery(delivery_id), "claimed")
            mail_gateway.finish_delivery(delivery_id, accepted=False)
            self.assertEqual(mail_gateway.claim_delivery(delivery_id), "claimed")


if __name__ == "__main__":
    unittest.main()
