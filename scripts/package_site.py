from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path("out")
with ZipFile("smart-farmer-site.zip", "w", ZIP_DEFLATED) as archive:
    for path in root.rglob("*"):
        if path.is_file():
            archive.write(path, path.relative_to(root).as_posix())
