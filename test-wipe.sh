#!/bin/bash

# Test environment reset script
# Wipes test directories and downloads fresh random images from Picsum

set -e

TEST_CONTENT="./test/test-content"
TEST_PROJECT="./test/test-project"

echo "🧹 Wiping test directories..."

# Remove contents (but keep directories)
rm -rf "${TEST_CONTENT:?}"/*
rm -rf "${TEST_PROJECT:?}"/*

# Recreate if they don't exist
mkdir -p "$TEST_CONTENT"
mkdir -p "$TEST_PROJECT"

echo "📥 Downloading 20 random images from Picsum..."

for i in $(seq -w 1 20); do
  # Random dimensions between 800-1200
  width=$((800 + RANDOM % 400))
  height=$((600 + RANDOM % 400))

  curl -sL "https://picsum.photos/${width}/${height}" -o "${TEST_CONTENT}/image_${i}.jpg" &

  # Limit concurrent downloads
  if (( i % 5 == 0 )); then
    wait
    echo "  Downloaded $i/20..."
  fi
done

wait
echo "✅ Done! 20 images downloaded to $TEST_CONTENT"
