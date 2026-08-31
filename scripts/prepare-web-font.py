"""Optional asset preparation: fontTools 4.63 + Brotli; not needed on the server."""
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = "https://raw.githubusercontent.com/google/fonts/db398e70ce14719a0c99da39fd257c0c75dfae02/ofl/opensans/OpenSans%5Bwdth%2Cwght%5D.ttf"
EXPECTED_HASH = "36643644f318a812aab2d2ed3bb98f8cf0872527f835fe9398d95fe6b9adb878"
WEIGHTS = {
    400: "bd757f1ad06c84be47a2d34d6cf8c292de0e1185",
    500: "b01c3619d0e5c1d8d1f4744ce7d288181a40a86b",
    600: "1af2a61f0a1d75ce73e36e6c387dd27f6b09bfa0",
    700: "38cd786c2a409251d1efc9eca27b2335faebeaf5",
    800: "8c6653612678d062e443031fc4db29c22d1e3466",
}

with urlopen(SOURCE, timeout=30) as response:
    source = response.read()
assert sha256(source).hexdigest() == EXPECTED_HASH, "Unexpected upstream font"
original = TTFont(ROOT / f"public/wp-assets/external/{WEIGHTS[400]}.woff2", recalcTimestamp=False)
font = instantiateVariableFont(TTFont(BytesIO(source), recalcTimestamp=False), {"wdth": 100})
# Reload after axis instancing so the glyph and variation tables share names.
buffer = BytesIO()
font.save(buffer)
buffer.seek(0)
font = TTFont(buffer, recalcTimestamp=False)
options = subset.Options()
options.name_IDs = ["*"]
options.name_legacy = True
options.name_languages = ["*"]
subsetter = subset.Subsetter(options=options)
# Preserve the exact original character coverage, including the existing
# Cyrillic fallback; do not change the site's typography to a new font subset.
subsetter.populate(unicodes=original.getBestCmap().keys())
subsetter.subset(font)
font.flavor = "woff2"
output = ROOT / "public/media/fonts/open-sans-latin-variable-v3.003.woff2"
output.parent.mkdir(parents=True, exist_ok=True)
font.save(output)
for weight, name in WEIGHTS.items():
    before = TTFont(ROOT / f"public/wp-assets/external/{name}.woff2")
    after = instantiateVariableFont(TTFont(output), {"wght": weight})
    before_map, after_map = before.getBestCmap(), after.getBestCmap()
    assert before_map.keys() == after_map.keys(), "Character coverage changed"
    assert all(before["hmtx"][glyph][0] == after["hmtx"][after_map[code]][0]
               for code, glyph in before_map.items()), f"Advance widths changed at {weight}"
print(f"Prepared {output.stat().st_size} bytes; all five weights retain their advance widths.")
