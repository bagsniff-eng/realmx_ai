import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_get_siwe_nonce_for_authentication():
    url = f"{BASE_URL}/api/auth/nonce"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed with exception: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    try:
        nonce = response.json()
    except ValueError:
        # If response is not a JSON string but plain text string
        nonce = response.text

    # According to PRD, the response schema for 200 is a string nonce
    assert isinstance(nonce, str), f"Expected nonce to be a string but got {type(nonce)}"
    assert len(nonce) > 0, "Nonce string is empty"

test_get_siwe_nonce_for_authentication()