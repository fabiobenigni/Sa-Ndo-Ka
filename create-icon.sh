#!/bin/bash

# Script per creare icona PNG da SVG
# Richiede ImageMagick o Inkscape

SVG_FILE="public/icon.svg"
PNG_FILE="public/icon.png"

if command -v convert &> /dev/null; then
    echo "Creating PNG icon with ImageMagick..."
    convert -background none -resize 512x512 "$SVG_FILE" "$PNG_FILE"
elif command -v inkscape &> /dev/null; then
    echo "Creating PNG icon with Inkscape..."
    inkscape "$SVG_FILE" --export-type=png --export-filename="$PNG_FILE" --export-width=512 --export-height=512
else
    echo "ImageMagick or Inkscape not found. Please install one of them to generate the PNG icon."
    echo "Or use an online SVG to PNG converter with the SVG file at: $SVG_FILE"
fi

