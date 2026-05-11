from PIL import Image
import os

TARGET_W = 4096
QUALITY = 85

ROOT_DIR = "."   # current folder

print("Searching folders...")

for foldername, subfolders, filenames in os.walk(ROOT_DIR):

    for filename in filenames:

        if filename.lower().endswith(".jpg"):

            path = os.path.join(foldername, filename)

            try:
                img = Image.open(path)

                w, h = img.size
                new_h = int(TARGET_W * h / w)

                img = img.resize((TARGET_W, new_h), Image.LANCZOS)

                img.save(
                    path,
                    "JPEG",
                    quality=QUALITY,
                    optimize=True
                )

                original_mb = os.path.getsize(path) / 1_000_000

                print(f"✓ Resized: {path} ({original_mb:.1f} MB)")

            except Exception as e:
                print(f"ERROR: {path}")
                print(e)

print("DONE.")