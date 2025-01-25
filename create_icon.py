import cairosvg
from PIL import Image


# Function to convert SVG to PNG
def svg_to_png(svg_file, png_file, width=1024, height=1024):
    cairosvg.svg2png(
        url=svg_file, write_to=png_file, output_width=width, output_height=height
    )
    print(f"PNG file created: {png_file}")


input_svg_file = "./assets/icons/icon.svg"
linux_icon_file = "./assets/icons/icon.png"
windows_icon_file = "./assets/icons/icon.ico"

icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]

for width, height in icon_sizes:
    svg_to_png(input_svg_file, f"./assets/icons/icon_{width}.png", width, height)

svg_to_png(input_svg_file, "./assets/icons/icon.png", 512, 512)

# Windows Icon
img = Image.open(linux_icon_file)
img.save(windows_icon_file, sizes=icon_sizes)
