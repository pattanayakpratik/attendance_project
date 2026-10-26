import subprocess
import re
import sys
import os
import time

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    cloudflared_exe = os.path.join(project_root, 'bin', 'cloudflared.exe')

    if not os.path.exists(cloudflared_exe):
        print(f"[-] cloudflared binary not found at: {cloudflared_exe}")
        sys.exit(1)

    print("================================================================")
    print("   🌐 STARTING ATTENDANCE BACKEND WITH FREE CLOUDFLARE TUNNEL   ")
    print("================================================================")

    # 1. Start Flask API server
    python_exe = os.path.join(base_dir, '.venv', 'Scripts', 'python.exe')
    if not os.path.exists(python_exe):
        python_exe = sys.executable

    print("[1/2] Starting Flask Backend on http://127.0.0.1:5000...")
    app_proc = subprocess.Popen(
        [python_exe, os.path.join(base_dir, 'app.py')],
        cwd=base_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )

    time.sleep(2)

    # 2. Start Cloudflare Tunnel
    print("[2/2] Launching Cloudflare Tunnel (creating public HTTPS URL)...")
    cf_proc = subprocess.Popen(
        [cloudflared_exe, 'tunnel', '--url', 'http://127.0.0.1:5000', '--no-autoupdate'],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    tunnel_url = None
    url_regex = re.compile(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com')

    try:
        for line in cf_proc.stdout:
            match = url_regex.search(line)
            if match and not tunnel_url:
                tunnel_url = match.group(0)
                print("\n" + "=" * 64)
                print("   🎉 YOUR ATTENDANCE SYSTEM IS NOW LIVE ONLINE FOR FREE!  ")
                print("=" * 64)
                print(f"   Public API URL : {tunnel_url}")
                print(f"   Local Server   : http://127.0.0.1:5000")
                print("-" * 64)
                print("   📲 Mobile Flutter App:")
                print(f"      Set server URL in Login settings gear to: {tunnel_url}")
                print("   💻 Next.js Web Dashboard:")
                print(f"      Add to web_nextjs/.env.local: NEXT_PUBLIC_API_URL={tunnel_url}")
                print("=" * 64 + "\n")
                print("[*] Tunnel active. Press Ctrl+C anytime to stop.\n")

            if "ERR" in line or "error" in line.lower():
                print(f"[cf log] {line.strip()}")

    except KeyboardInterrupt:
        print("\n[*] Stopping tunnel and backend server...")
    finally:
        cf_proc.terminate()
        app_proc.terminate()
        print("[+] All processes stopped.")

if __name__ == '__main__':
    main()
