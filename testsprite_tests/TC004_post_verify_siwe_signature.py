import requests
import json
from urllib.parse import urljoin

BASE_URL = "http://localhost:3001"
VERIFY_ENDPOINT = "/api/auth/verify"
NONCE_ENDPOINT = "/api/auth/nonce"
TIMEOUT = 30

def test_post_verify_siwe_signature():
    session = requests.Session()

    try:
        # Step 1: Get nonce to build a valid SIWE message
        nonce_resp = session.get(urljoin(BASE_URL, NONCE_ENDPOINT), timeout=TIMEOUT)
        assert nonce_resp.status_code == 200
        nonce = nonce_resp.text
        assert isinstance(nonce, str) and len(nonce) > 0

        # Step 2: Prepare a valid SIWE message and signature
        message = {
            "domain": "localhost:3001",
            "address": "0x0000000000000000000000000000000000000000",
            "statement": "Sign in to RealmxAI",
            "uri": "http://localhost:3001",
            "version": "1",
            "chainId": 1,
            "nonce": nonce,
            "issuedAt": "2026-03-16T00:00:00.000Z"
        }
        valid_signature = "0xvalidsignatureplaceholder"

        # Step 3: POST valid message and signature
        verify_url = urljoin(BASE_URL, VERIFY_ENDPOINT)
        headers = {"Content-Type": "application/json"}
        payload = {"message": message, "signature": valid_signature}
        resp = session.post(verify_url, json=payload, headers=headers, timeout=TIMEOUT)

        assert resp.status_code == 200
        assert resp.json() == True

        # Verify HTTP-only JWT cookie is set (check cookies)
        jwt_cookie = None
        for cookie in session.cookies:
            if "jwt" in cookie.name.lower() or "token" in cookie.name.lower():
                jwt_cookie = cookie
                break
        assert jwt_cookie is not None

        # Step 4: Test tampered message - change the nonce to tamper
        tampered_message = dict(message)
        tampered_message["nonce"] = "tamperednonce"
        payload_tampered = {"message": tampered_message, "signature": valid_signature}
        resp_tampered = session.post(verify_url, json=payload_tampered, headers=headers, timeout=TIMEOUT)

        assert resp_tampered.status_code == 401
        assert resp_tampered.json() == False

        # Step 5: Test invalid signature with valid message
        invalid_signature = "0xinvalidsignature"
        payload_invalid_sig = {"message": message, "signature": invalid_signature}
        resp_invalid_sig = session.post(verify_url, json=payload_invalid_sig, headers=headers, timeout=TIMEOUT)

        assert resp_invalid_sig.status_code == 401
        assert resp_invalid_sig.json() == False

    finally:
        session.close()


test_post_verify_siwe_signature()