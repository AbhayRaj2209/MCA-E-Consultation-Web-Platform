import argparse
import json
import os
import sys
from pathlib import Path
from urllib.request import urlopen

CHUNK_SIZE = 1024 * 1024  # 1 MB


def human_size(n: int) -> str:
    suffixes = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    f = float(n)
    while f >= 1024 and i < len(suffixes) - 1:
        f /= 1024
        i += 1
    return f"{f:.2f} {suffixes[i]}"


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urlopen(url) as resp:
        total = resp.length if hasattr(resp, "length") and resp.length else None
        downloaded = 0
        with open(dest, "wb") as f:
            while True:
                chunk = resp.read(CHUNK_SIZE)
                if not chunk:
                    break
                f.write(chunk)
                downloaded += len(chunk)
                if total:
                    pct = downloaded * 100 / total
                    print(f"\rDownloading {dest.name}: {pct:.1f}% ({human_size(downloaded)}/{human_size(total)})", end="")
                else:
                    print(f"\rDownloading {dest.name}: {human_size(downloaded)}", end="")
    print("\nDone:", dest)


def process_item(item: dict, dry_run: bool = False) -> None:
    name = item.get("name")
    url = item.get("url")
    dest = Path(item.get("dest"))
    expected_size = item.get("expected_size")

    if not url or "PUT_URL_HERE" in url:
        print(f"[SKIP] {name}: URL not set. Edit models/weights_manifest.json")
        return

    if dest.exists():
        size = dest.stat().st_size
        if expected_size and size == expected_size:
            print(f"[SKIP] {name}: already present ({human_size(size)})")
            return
        else:
            print(f"[INFO] {name}: file exists ({human_size(size)}), will overwrite.")

    if dry_run:
        print(f"[DRY-RUN] Would download: {url} -> {dest}")
        return

    download(url, dest)

    if expected_size:
        size = dest.stat().st_size
        if size != expected_size:
            print(f"[WARN] {name}: size mismatch (expected {expected_size}, got {size}).")
        else:
            print(f"[OK] {name}: size verified ({human_size(size)}).")


def main():
    parser = argparse.ArgumentParser(description="Download model weights as per manifest.")
    parser.add_argument("--manifest", default=str(Path(__file__).parent / "weights_manifest.json"), help="Path to manifest JSON")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without downloading")
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    if not manifest_path.exists():
        print("Manifest not found:", manifest_path)
        sys.exit(1)

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    items = manifest.get("items", [])
    if not items:
        print("No items found in manifest.")
        sys.exit(0)

    for item in items:
        process_item(item, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
