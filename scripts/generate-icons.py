"""Generate PNG icons for SafePrompt Chrome extension."""
from PIL import Image, ImageDraw
import os
import math

def create_icon(size):
    """Create a shield+lock icon at the given size."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    s = size  # shorthand
    cx, cy = s // 2, s // 2

    # Background circle with gradient effect
    for i in range(int(s * 0.47), 0, -1):
        ratio = i / (s * 0.47)
        r = int(99 + (139 - 99) * (1 - ratio))
        g = int(102 + (92 - 102) * (1 - ratio))
        b = int(241 + (246 - 241) * (1 - ratio))
        draw.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(r, g, b, 255))

    # Shield shape
    shield_top = int(s * 0.16)
    shield_left = int(s * 0.25)
    shield_right = int(s * 0.75)
    shield_mid = int(s * 0.50)
    shield_bottom = int(s * 0.84)

    # Draw shield as polygon
    shield_points = [
        (cx, shield_top),           # top center
        (shield_right, int(s * 0.28)),  # top right
        (shield_right, shield_mid),     # mid right
        (cx, shield_bottom),            # bottom center
        (shield_left, shield_mid),      # mid left
        (shield_left, int(s * 0.28)),   # top left
    ]
    draw.polygon(shield_points, fill=(255, 255, 255, 242))

    # Lock body (rectangle)
    lock_left = int(s * 0.40)
    lock_right = int(s * 0.60)
    lock_top = int(s * 0.45)
    lock_bottom = int(s * 0.61)
    lock_radius = max(1, int(s * 0.02))
    draw.rounded_rectangle(
        [lock_left, lock_top, lock_right, lock_bottom],
        radius=lock_radius,
        fill=(99, 102, 241, 255)
    )

    # Lock shackle (arc)
    shackle_left = int(s * 0.43)
    shackle_right = int(s * 0.57)
    shackle_top = int(s * 0.31)
    shackle_bottom = int(s * 0.47)
    shackle_width = max(2, int(s * 0.03))
    draw.arc(
        [shackle_left, shackle_top, shackle_right, shackle_bottom],
        start=180, end=360,
        fill=(99, 102, 241, 255),
        width=shackle_width
    )
    # Shackle sides
    draw.line([(shackle_left, int(s * 0.39)), (shackle_left, lock_top)],
              fill=(99, 102, 241, 255), width=shackle_width)
    draw.line([(shackle_right, int(s * 0.39)), (shackle_right, lock_top)],
              fill=(99, 102, 241, 255), width=shackle_width)

    # Keyhole
    keyhole_r = max(1, int(s * 0.023))
    keyhole_cy = int(s * 0.515)
    draw.ellipse(
        [cx - keyhole_r, keyhole_cy - keyhole_r, cx + keyhole_r, keyhole_cy + keyhole_r],
        fill=(255, 255, 255, 255)
    )
    # Keyhole bottom line
    line_w = max(1, int(s * 0.015))
    draw.rectangle(
        [cx - line_w // 2, keyhole_cy, cx + line_w // 2, int(s * 0.56)],
        fill=(255, 255, 255, 255)
    )

    return img

# Generate icons
icons_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'icons')
os.makedirs(icons_dir, exist_ok=True)

for size in [16, 48, 128]:
    icon = create_icon(size)
    path = os.path.join(icons_dir, f'icon{size}.png')
    icon.save(path, 'PNG')
    print(f'Created {path} ({size}x{size})')

print('Done!')
