import requests
from requests_ntlm import HttpNtlmAuth
import time
import re
import sys

# Configuration
ADMIN_URL = "http://127.0.0.1/admin_view.php"
USERNAME = "WORKGROUP\\admin"
PASSWORD = "SuperSecretP@ssw0rd"

def visit_attacker(url):
    """
    Simulates the Admin visiting the attacker's URL.
    This is where the NTLM Auth happens.
    """
    print(f"[Bot] Visiting extracted URL: {url}")
    session = requests.Session()
    session.auth = HttpNtlmAuth(USERNAME, PASSWORD)
    try:
        # We perform a HEAD or GET request.
        # If the attacker server (ntlmrelayx) sends 401 WWW-Authenticate: NTLM,
        # requests_ntlm will automatically handle the handshake.
        r = session.get(url, timeout=5)
        print(f"[Bot] Status: {r.status_code}")
    except Exception as e:
        print(f"[Bot] Error visiting {url}: {e}")

def run_bot():
    print("[Bot] Starting Admin Simulation Loop...")
    while True:
        try:
            # 1. Fetch the Admin View (Local, No Auth needed for 127.0.0.1 logic in PHP)
            r = requests.get(ADMIN_URL)
            if r.status_code == 200:
                content = r.text
                # 2. Parse for XSS Payloads
                # We look for <script src="..."> or <img src="..."> tags injected by the user.
                # Regex to find URLs in src attributes
                urls = re.findall(r'src=["\'](http[s]?://[^"\']+)["\']', content)
                
                for url in urls:
                    # Avoid self-referencing loops if possible, but for CTF simplicity:
                    if "127.0.0.1" not in url and "localhost" not in url:
                        visit_attacker(url)
            
            # Clear the tickets to avoid spamming? 
            # Or just wait. Let's wait.
            time.sleep(10)
            
        except Exception as e:
            print(f"[Bot] Loop Error: {e}")
            time.sleep(10)

if __name__ == "__main__":
    run_bot()
