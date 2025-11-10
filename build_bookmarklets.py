#!/usr/bin/env python3
"""
Bookmarklet Builder Script
Reads bookmarklet files and embeds their code into bookmarklets.json
This allows bookmarklets to work even in file:// protocol (no CORS issues)
"""

import json
import os
from pathlib import Path

def read_bookmarklet_file(filepath):
    """Read a bookmarklet file and return its content."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

def build_bookmarklets():
    """Build bookmarklets.json with embedded code."""
    script_dir = Path(__file__).parent
    bookmarklet_dir = script_dir / 'bookmarklet'
    json_file = bookmarklet_dir / 'bookmarklets.json'
    
    if not json_file.exists():
        print(f"Error: {json_file} not found!")
        return False
    
    # Read the existing JSON structure
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            bookmarklets = json.load(f)
    except Exception as e:
        print(f"Error reading {json_file}: {e}")
        return False
    
    # Embed code for each bookmarklet
    updated = False
    for bookmarklet in bookmarklets:
        filename = bookmarklet.get('file')
        if not filename:
            print(f"Warning: Bookmarklet '{bookmarklet.get('name')}' has no file specified")
            continue
        
        filepath = bookmarklet_dir / filename
        if not filepath.exists():
            print(f"Warning: File {filename} not found for '{bookmarklet.get('name')}'")
            continue
        
        code = read_bookmarklet_file(filepath)
        if code:
            bookmarklet['code'] = code
            updated = True
            print(f"[OK] Embedded code for: {bookmarklet.get('name')} ({filename})")
        else:
            print(f"[FAIL] Failed to read code for: {bookmarklet.get('name')} ({filename})")
    
    if not updated:
        print("No bookmarklets were updated.")
        return False
    
    # Write updated JSON back
    try:
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(bookmarklets, f, indent=2, ensure_ascii=False)
        print(f"\n[OK] Successfully updated {json_file}")
        print(f"  Embedded code for {len([b for b in bookmarklets if 'code' in b])} bookmarklet(s)")
        return True
    except Exception as e:
        print(f"Error writing {json_file}: {e}")
        return False

def update_javascript_file():
    """Update bookmarklets.js to use embedded code from JSON."""
    script_dir = Path(__file__).parent
    bookmarklet_dir = script_dir / 'bookmarklet'
    json_file = bookmarklet_dir / 'bookmarklets.json'
    js_file = script_dir / 'bookmarklets.js'
    
    if not json_file.exists():
        print(f"Error: {json_file} not found!")
        return False
    
    # Read the JSON
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            bookmarklets = json.load(f)
    except Exception as e:
        print(f"Error reading {json_file}: {e}")
        return False
    
    # Generate JavaScript array with embedded code
    js_array_items = []
    for b in bookmarklets:
        item = {
            "name": b.get('name', ''),
            "description": b.get('description', ''),
            "file": b.get('file', ''),
            "icon": b.get('icon', '🔖')
        }
        if 'code' in b:
            item['code'] = b['code']
        js_array_items.append(json.dumps(item, ensure_ascii=False, indent=8))
    
    js_array = '[\n' + ',\n'.join(js_array_items) + '\n]'
    
    # Read the current bookmarklets.js
    try:
        with open(js_file, 'r', encoding='utf-8') as f:
            js_content = f.read()
    except Exception as e:
        print(f"Error reading {js_file}: {e}")
        return False
    
    # Replace the EMBEDDED_BOOKMARKLETS constant
    import re
    pattern = r'const EMBEDDED_BOOKMARKLETS = \[.*?\];'
    replacement = f'const EMBEDDED_BOOKMARKLETS = {js_array};'
    
    new_js_content = re.sub(pattern, replacement, js_content, flags=re.DOTALL)
    
    if new_js_content == js_content:
        print("Warning: Could not find EMBEDDED_BOOKMARKLETS in bookmarklets.js")
        return False
    
    # Write updated JavaScript
    try:
        with open(js_file, 'w', encoding='utf-8') as f:
            f.write(new_js_content)
        print(f"[OK] Successfully updated {js_file}")
        return True
    except Exception as e:
        print(f"Error writing {js_file}: {e}")
        return False

def main():
    """Main function."""
    print("=" * 60)
    print("Bookmarklet Builder")
    print("=" * 60)
    print()
    
    print("Step 1: Embedding code into bookmarklets.json...")
    if not build_bookmarklets():
        print("Failed to build bookmarklets.json")
        return
    
    print("\nStep 2: Updating bookmarklets.js with embedded code...")
    if not update_javascript_file():
        print("Failed to update bookmarklets.js")
        return
    
    print("\n" + "=" * 60)
    print("[SUCCESS] Build complete! Bookmarklets are ready to use.")
    print("=" * 60)

if __name__ == '__main__':
    main()

