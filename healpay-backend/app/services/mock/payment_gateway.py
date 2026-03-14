"""
Mock Payment Gateway
Simulates Stripe-style patient card payment processing.
Uses standard test card numbers like Stripe's test mode.
"""
import hashlib
import secrets
from datetime import datetime
from typing import Dict, Any


# Test card patterns (mirrors Stripe's test card numbers)
TEST_CARDS = {
    "4242424242424242": {"result": "success",  "brand": "Visa",       "last4": "4242"},
    "4000000000000002": {"result": "declined",  "brand": "Visa",       "last4": "0002", "decline_code": "card_declined"},
    "4000000000009995": {"result": "declined",  "brand": "Visa",       "last4": "9995", "decline_code": "insufficient_funds"},
    "5555555555554444": {"result": "success",  "brand": "Mastercard",  "last4": "4444"},
    "5200828282828210": {"result": "success",  "brand": "Mastercard",  "last4": "8210"},
    "378282246310005":  {"result": "success",  "brand": "Amex",        "last4": "0005"},
    "6011111111111117": {"result": "success",  "brand": "Discover",    "last4": "1117"},
    "4000000000000069": {"result": "declined",  "brand": "Visa",       "last4": "0069", "decline_code": "expired_card"},
    "4000000000000127": {"result": "declined",  "brand": "Visa",       "last4": "0127", "decline_code": "incorrect_cvc"},
}

DECLINE_MESSAGES = {
    "card_declined":       "Your card was declined. Please try another payment method.",
    "insufficient_funds":  "Your card has insufficient funds.",
    "expired_card":        "Your card has expired. Please use a card with a valid expiration date.",
    "incorrect_cvc":       "Your card's security code is incorrect.",
    "generic_decline":     "Your card was declined. Contact your bank for more information.",
}


def process_payment(
    invoice_id: int,
    amount: float,
    card_number: str,
    card_holder_name: str,
    expiry_month: int,
    expiry_year: int,
    cvv: str,
) -> Dict[str, Any]:
    """
    Simulates card payment processing.
    Recognized test cards always return their defined result.
    Unknown cards: any card starting with 4/5 succeeds; others fail.
    """
    # Normalize card number
    normalized = card_number.replace(" ", "").replace("-", "")

    # Look up test card
    card_info = TEST_CARDS.get(normalized)

    if card_info:
        result = card_info["result"]
        brand = card_info["brand"]
        last4 = card_info["last4"]
        decline_code = card_info.get("decline_code", "generic_decline")
    else:
        # Unknown card — use first digit to determine outcome realistically
        last4 = normalized[-4:] if len(normalized) >= 4 else "0000"
        brand = (
            "Visa" if normalized.startswith("4") else
            "Mastercard" if normalized.startswith("5") else
            "Amex" if normalized.startswith("3") else
            "Discover" if normalized.startswith("6") else
            "Unknown"
        )
        result = "success" if normalized.startswith(("4", "5", "3", "6")) else "declined"
        decline_code = "generic_decline"

    # Generate a deterministic transaction ID
    seed = f"{invoice_id}|{amount}|{normalized}"
    txn_id = f"TXN-{int(hashlib.md5(seed.encode()).hexdigest(), 16) % 10**10:010d}"

    if result == "declined":
        return {
            "success": False,
            "status": "declined",
            "transaction_id": None,
            "error_code": decline_code,
            "error_message": DECLINE_MESSAGES.get(decline_code, DECLINE_MESSAGES["generic_decline"]),
            "card_brand": brand,
            "last4": last4,
            "amount": amount,
            "invoice_id": invoice_id,
            "timestamp": datetime.utcnow().isoformat(),
        }

    return {
        "success": True,
        "status": "succeeded",
        "transaction_id": txn_id,
        "receipt_id": f"RCP-{secrets.token_hex(6).upper()}",
        "card_brand": brand,
        "last4": last4,
        "card_holder_name": card_holder_name,
        "amount": amount,
        "currency": "USD",
        "invoice_id": invoice_id,
        "timestamp": datetime.utcnow().isoformat(),
        "receipt_email_sent": True,
        "message": f"Payment of ${amount:.2f} processed successfully.",
    }


def get_test_cards_info() -> list:
    """Returns test card hints to display in the UI (like Stripe's test mode docs)."""
    return [
        {"card_number": "4242 4242 4242 4242", "brand": "Visa",       "result": "✅ Success",           "use_for": "Happy path — payment succeeds"},
        {"card_number": "5555 5555 5555 4444", "brand": "Mastercard", "result": "✅ Success",           "use_for": "Mastercard successful payment"},
        {"card_number": "3782 822463 10005",   "brand": "Amex",       "result": "✅ Success",           "use_for": "American Express payment"},
        {"card_number": "4000 0000 0000 0002", "brand": "Visa",       "result": "❌ Declined",          "use_for": "Generic card decline scenario"},
        {"card_number": "4000 0000 0000 9995", "brand": "Visa",       "result": "❌ Insufficient Funds","use_for": "Insufficient funds error"},
        {"card_number": "4000 0000 0000 0069", "brand": "Visa",       "result": "❌ Expired Card",      "use_for": "Expired card error"},
    ]
