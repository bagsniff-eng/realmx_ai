import requests
import uuid

BASE_URL = "http://localhost:3001"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def create_user(googleId_suffix, walletAddress_suffix, email_suffix, optionalReferralCode=None):
    payload = {
        "googleId": f"test-google-{googleId_suffix}",
        "walletAddress": f"0xWallet{walletAddress_suffix}",
        "email": f"user{email_suffix}@example.com"
    }
    if optionalReferralCode:
        payload["optionalReferralCode"] = optionalReferralCode
    response = requests.post(f"{BASE_URL}/api/users", json=payload, headers=HEADERS, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()


def delete_user(user_id):
    try:
        requests.delete(f"{BASE_URL}/api/users/{user_id}", timeout=TIMEOUT)
    except Exception:
        pass  # best-effort cleanup


def test_post_referral_link_user_and_grant_reward():
    # Step 1: Create referrer user to get a valid referral code
    referrer = create_user("referrer", "referrer", "referrer")
    referrer_user_id = referrer["userId"]
    referral_code = referrer["referralCode"]

    # Step 2: Create new user (referred user) without a referral code
    referred = create_user("referred", "referred", "referred")
    referred_user_id = referred["userId"]

    # Step 3: Successful referral linking - should return 200 with success true and referrerId
    referral_payload = {
        "code": referral_code,
        "userId": referred_user_id
    }
    try:
        r = requests.post(f"{BASE_URL}/api/referral", json=referral_payload, headers=HEADERS, timeout=TIMEOUT)
        r.raise_for_status()
        resp_json = r.json()
        assert resp_json.get("success") is True
        assert resp_json.get("referrerId") == referrer_user_id
    except Exception as e:
        # cleanup
        delete_user(referrer_user_id)
        delete_user(referred_user_id)
        raise e

    # Step 4: Duplicate referral - should return 400 with appropriate error message
    r_dup = requests.post(f"{BASE_URL}/api/referral", json=referral_payload, headers=HEADERS, timeout=TIMEOUT)
    assert r_dup.status_code == 400
    dup_resp = r_dup.json()
    assert dup_resp.get("success") is False
    assert "duplicate referral" in dup_resp.get("error", "").lower()

    # Step 5: Invalid referral code - random uuid, expect 400 error
    invalid_payload = {
        "code": str(uuid.uuid4()),
        "userId": referred_user_id
    }
    r_invalid = requests.post(f"{BASE_URL}/api/referral", json=invalid_payload, headers=HEADERS, timeout=TIMEOUT)
    assert r_invalid.status_code == 400
    invalid_resp = r_invalid.json()
    assert invalid_resp.get("success") is False
    assert "invalid code" in invalid_resp.get("error", "").lower()

    # Step 6: Self-referral - user tries to use own referral code, expect 400 error
    self_referral_payload = {
        "code": referral_code,
        "userId": referrer_user_id
    }
    r_self = requests.post(f"{BASE_URL}/api/referral", json=self_referral_payload, headers=HEADERS, timeout=TIMEOUT)
    assert r_self.status_code == 400
    self_resp = r_self.json()
    assert self_resp.get("success") is False
    assert "self-referral" in self_resp.get("error", "").lower()

    # Cleanup created users
    delete_user(referrer_user_id)
    delete_user(referred_user_id)


test_post_referral_link_user_and_grant_reward()