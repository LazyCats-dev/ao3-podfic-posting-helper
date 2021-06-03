import json
import os

manifest_path = os.path.join("chrome-extension", "manifest.json")

with open(manifest_path) as f:
    manifest = json.load(f)
    manifest["permissions"].append("*://archiveofourown.org/*")

with open(manifest_path, "w") as f:
    json.dump(manifest, f, indent=4)
