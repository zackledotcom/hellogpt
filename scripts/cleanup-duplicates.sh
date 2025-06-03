#!/bin/bash

echo "Cleaning up duplicate .js files..."

# Find all .ts files with .js equivalents
find packages -name "*.ts" | while read tsfile; do
  jsfile="${tsfile%.ts}.js"
  if [ -f "$jsfile" ]; then
    echo "Removing duplicate: $jsfile"
    rm "$jsfile"
  fi
done

echo "Updating imports in .ts and .tsx files..."

# Update all imports
find packages -name "*.ts" -o -name "*.tsx" | while read file; do
  if [ -f "$file" ]; then
    # Use sed to replace .js" with .ts" in imports
    sed -i '' 's/\.js"/\.ts"/g' "$file"
    echo "Updated imports in: $file"
  fi
done

echo "Cleanup complete!" 