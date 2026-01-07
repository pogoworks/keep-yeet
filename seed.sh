#!/bin/bash

# Seed script - resets test environment with fresh random images
# Wipes seed directories and downloads images from Picsum

set -e

SEED_DIR="./seed"
SOURCES=("source1" "source2" "source3")
IMAGES_PER_SOURCE=15

echo "Wiping seed directories..."

# Wipe all source folders and project folder
for src in "${SOURCES[@]}"; do
  rm -rf "${SEED_DIR:?}/${src:?}"/*
  mkdir -p "$SEED_DIR/$src"
done
rm -rf "${SEED_DIR:?}/project"/*
mkdir -p "$SEED_DIR/project"

echo "Downloading $IMAGES_PER_SOURCE images to each source folder..."

for src in "${SOURCES[@]}"; do
  echo "  $src..."
  for i in $(seq 1 $IMAGES_PER_SOURCE); do
    width=$((800 + RANDOM % 400))
    height=$((600 + RANDOM % 400))
    curl -sL "https://picsum.photos/${width}/${height}" -o "${SEED_DIR}/${src}/image_$(printf '%02d' $i).jpg" &

    # Limit concurrent downloads
    if (( i % 5 == 0 )); then
      wait
    fi
  done
  wait
done

total=$((IMAGES_PER_SOURCE * ${#SOURCES[@]}))
echo "Done! $total images downloaded to $SEED_DIR"
