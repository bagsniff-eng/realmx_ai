import sys

with open('src/App.tsx', 'rb') as f:
    raw = f.read()

# Mojibake: UTF-8 bytes read as Latin-1 (Windows-1252) then re-encoded as UTF-8
# Each bad sequence is the Latin-1 char re-encoded to UTF-8:
#   â€¢  = U+2022 BULLET (•)
#   â€"  = U+2014 EM DASH (—)
#   âœ"   = U+2713 CHECK MARK (✓)
#   âœ•  = U+2715 (✕)
#   â†'  = U+2192 RIGHTWARD ARROW (→)
#   â†»  = U+21BB CLOCKWISE OPEN CIRCLE ARROW (↻)
#   â—   = U+25CF BLACK CIRCLE (●)

replacements = [
    # (bad_utf8_bytes, correct_utf8_bytes)
    (b'\xc3\xa2\xe2\x80\xac\xe2\x80\xa2', '•'.encode('utf-8')),   # â€¢ -> •
    (b'\xc3\xa2\xe2\x80\xac\xe2\x80\x9d', '—'.encode('utf-8')),   # â€" -> —
    (b'\xc3\xa2\xe2\x80\x9c\xe2\x80\x9c', '✓'.encode('utf-8')),   # âœ" -> ✓
    (b'\xc3\xa2\xe2\x80\x9c\xe2\x80\xa2', '✕'.encode('utf-8')),   # âœ• -> ✕
    (b'\xc3\xa2\xe2\x80\xa0\xe2\x80\x99', '→'.encode('utf-8')),   # â†' -> →
    (b'\xc3\xa2\xe2\x80\xa0\xc2\xbb', '↻'.encode('utf-8')),       # â†» -> ↻
    (b'\xc3\xa2\xe2\x80\x94', '●'.encode('utf-8')),                # â— -> ●
]

for bad, good in replacements:
    count = raw.count(bad)
    if count:
        print(f"Replacing {count}x {bad!r} -> {good!r}")
    raw = raw.replace(bad, good)

with open('src/App.tsx', 'wb') as f:
    f.write(raw)

print('Encoding fix complete.')
