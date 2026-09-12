#!/usr/bin/env python3
"""
scripts/deploy_to_router.py
---------------------------
Hot-deploy local rootfs modifications directly to a running BL-WR2000 router over Telnet.

Why this works:
1. The router runs a writable RAM overlay: `rootfs on / type rootfs (rw)`.
   Files in `/etc_ro/` can be directly overwritten in RAM without flashing or rebooting.
2. The router has `/bin/wget` built-in, enabling high-speed LAN file transfer.

Usage:
    python scripts/deploy_to_router.py
    python scripts/deploy_to_router.py web/admin/more.html web/admin/js/getinfo.js
"""

import argparse
import http.server
import os
import socket
import socketserver
import sys
import telnetlib
import threading
import time

ROUTER_IP = "192.168.16.1"
ROUTER_TELNET_PORT = 23
ROUTER_USER = b"admin"
ROUTER_PASS = b"admin"
DEFAULT_HTTP_PORT = 8899

# Default set of frequently modified web / system files
DEFAULT_FILES = [
    ("web/admin/main.html", "/etc_ro/web/admin/main.html"),
    ("web/admin/more.html", "/etc_ro/web/admin/more.html"),
    ("web/admin/terminal.html", "/etc_ro/web/admin/terminal.html"),
    ("web/admin/upload_firmware.html", "/etc_ro/web/admin/upload_firmware.html"),
    ("web/admin/urlBlack.html", "/etc_ro/web/admin/urlBlack.html"),
    ("web/admin/health.html", "/etc_ro/web/admin/health.html"),
    ("web/admin/css/router.css", "/etc_ro/web/admin/css/router.css"),
    ("web/admin/images/health.png", "/etc_ro/web/admin/images/health.png"),
    ("web/admin/images/health1.png", "/etc_ro/web/admin/images/health1.png"),
    ("web/admin/js/getinfo.js", "/etc_ro/web/admin/js/getinfo.js"),
    ("web/admin/js/lang_main.js", "/etc_ro/web/admin/js/lang_main.js"),
    ("web/admin/js/lang_more.js", "/etc_ro/web/admin/js/lang_more.js"),
    ("web/admin/js/lang_setup.js", "/etc_ro/web/admin/js/lang_setup.js"),
    ("web/admin/mobile/js/lang_mobile.js", "/etc_ro/web/admin/mobile/js/lang_mobile.js"),
    ("rcS", "/etc_ro/rcS"),
    ("Wireless/RT2860AP/RT2860_default_vlan", "/etc_ro/Wireless/RT2860AP/RT2860_default_vlan"),
    ("Wireless/RT2860AP/RT2860_default_novlan", "/etc_ro/Wireless/RT2860AP/RT2860_default_novlan"),
]


def get_local_ip(target_ip):
    """Detect local IP on the network interface facing the router."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect((target_ip, 80))
        return s.getsockname()[0]
    finally:
        s.close()


def main():
    parser = argparse.ArgumentParser(description="Live hot-deploy rootfs files to BL-WR2000 router via Telnet/wget.")
    parser.add_argument("files", nargs="*", help="Specific relative path(s) under rootfs/etc_ro to deploy. If omitted, deploys default web/system files.")
    parser.add_argument("--port", type=int, default=DEFAULT_HTTP_PORT, help=f"Local HTTP server port (default: {DEFAULT_HTTP_PORT})")
    parser.add_argument("--router-ip", default=ROUTER_IP, help=f"Router IP address (default: {ROUTER_IP})")
    args = parser.parse_args()

    # Determine workspace root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    serve_dir = os.path.join(repo_root, "rootfs", "etc_ro")

    if not os.path.isdir(serve_dir):
        print(f"Error: Directory not found: {serve_dir}", file=sys.stderr)
        sys.exit(1)

    # Determine file list to transfer
    if args.files:
        files_to_deploy = []
        for f in args.files:
            rel = os.path.relpath(f, serve_dir) if os.path.isabs(f) else f.replace("\\", "/")
            dest = "/etc_ro/" + rel
            files_to_deploy.append((rel, dest))
    else:
        files_to_deploy = DEFAULT_FILES

    # Get local LAN IP
    try:
        local_ip = get_local_ip(args.router_ip)
    except Exception as e:
        print(f"Error determining local IP facing router ({args.router_ip}): {e}", file=sys.stderr)
        sys.exit(1)

    print(f"[*] Starting local HTTP server at http://{local_ip}:{args.port} serving {serve_dir}")

    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=serve_dir, **k)

        def log_message(self, format, *args):
            pass  # Keep output clean

    httpd = socketserver.TCPServer(("0.0.0.0", args.port), QuietHandler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    time.sleep(0.3)

    try:
        print(f"[*] Connecting to router Telnet at {args.router_ip}:{ROUTER_TELNET_PORT}...")
        tn = telnetlib.Telnet(args.router_ip, ROUTER_TELNET_PORT, timeout=5)
        tn.read_until(b"login: ")
        tn.write(ROUTER_USER + b"\n")
        tn.read_until(b"Password: ")
        tn.write(ROUTER_PASS + b"\n")
        tn.read_until(b"# ")
        print("[+] Logged into router via Telnet.")

        print(f"[*] Deploying {len(files_to_deploy)} file(s) directly to router /etc_ro/...")
        for rel_src, dest in files_to_deploy:
            local_full_path = os.path.join(serve_dir, rel_src.replace("/", os.sep))
            if not os.path.exists(local_full_path):
                print(f"[-] Skipping missing local file: {rel_src}")
                continue

            url = f"http://{local_ip}:{args.port}/{rel_src}"
            cmd = f"wget -q -O {dest} {url}\n".encode("ascii")
            tn.write(cmd)
            tn.read_until(b"# ")
            print(f"  [OK] {rel_src} -> {dest}")

        print("[+] Hot deploy complete! Changes are immediately live on the router.")
    except Exception as e:
        print(f"[-] Error during deploy: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        httpd.shutdown()
        try:
            tn.close()
        except Exception:
            pass


if __name__ == "__main__":
    main()
