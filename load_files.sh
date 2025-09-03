#!/bin/bash
mkdir -p ./data
if [ -d "~/Codemap/Prototype" ]; then
    cp ~/Codemap/Prototype/*.py ./data/ 2>/dev/null || echo "No .py files found in ~/Codemap/Prototype/"
else
    echo "Error: ~/Codemap/Prototype/ directory not found. Create it and add .py files."
fi
echo "Files loaded to ./data/ directory."
