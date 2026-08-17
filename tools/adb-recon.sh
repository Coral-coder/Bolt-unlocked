#!/usr/bin/env bash
# Bolt EUV head unit — READ-ONLY recon over adb.
#
# Safe: this only READS. It does not write, install, remount, or reboot anything.
# Run with the head unit connected and adb authorized, then send back the saved
# file. From that output we decide exactly how to install the Weather Radar app.
#
#   ./tools/adb-recon.sh
#
set +e

OUT="bolt-recon.txt"
sh_run() { echo "### adb shell $*"; adb shell "$@" 2>&1; echo; }

{
  echo "===== BOLT EUV HEAD UNIT RECON ====="
  echo "### adb devices"; adb devices -l; echo
  echo "### adb root (does it grant root?)"; adb root 2>&1; echo
  adb wait-for-device 2>/dev/null

  # --- identity: Android or QNX/Linux? root or not? ---
  sh_run id
  sh_run uname -a
  sh_run cat /proc/version
  sh_run getprop ro.build.version.release      # Android only; harmless otherwise
  sh_run getprop ro.product.model
  sh_run getprop ro.hardware
  sh_run getprop                               # full prop dump if Android

  # --- storage layout ---
  sh_run ls -la /
  sh_run mount
  sh_run df -h
  sh_run cat /proc/cpuinfo

  # --- Android app surface (if present) ---
  sh_run pm list packages -f
  sh_run cmd package list packages

  # --- NGI / GM app surface: where do apps live + how are they registered? ---
  echo "### find NGI app manifests (gmapp.json)"
  adb shell "find / -iname 'gmapp.json' 2>/dev/null"; echo
  echo "### find app manifests (*.mnf) / appshop / html apps"
  adb shell "find / \( -iname '*.mnf' -o -iname 'index.html' -o -ipath '*appshop*' -o -ipath '*/apps/*' \) 2>/dev/null | head -n 200"; echo

  # --- running processes + any webview/browser we could point at our URL ---
  sh_run ps -A
  sh_run ps
  echo "### anything browser/webview-ish"
  adb shell "ps -A 2>/dev/null | grep -iE 'web|browser|chrom|qt|hmi|launcher' 2>/dev/null"; echo

  # --- listening network services (confirms the Wi-Fi angle too) ---
  sh_run netstat -tlnp
  sh_run cat /proc/net/tcp
} 2>&1 | tee "$OUT"

echo
echo ">>> Saved to $OUT — send that file back."
