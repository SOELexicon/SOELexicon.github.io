#!/usr/bin/env python3
"""
Bookmarklet Builder Script
Reads bookmarklet files and embeds their code into bookmarklets.json
This allows bookmarklets to work even in file:// protocol (no CORS issues)
"""

import json
import os
import re
from pathlib import Path

def minify_bookmarklet_code(code):
    """
    Minify bookmarklet code by removing comments and putting on a single line.
    Bookmarklets cannot contain comments and should be on a single line.
    """
    if not code:
        return code
    
    # Check if code is already minified (single line, no comments, URL-encoded)
    # If it's already a single line with no obvious comments, return as-is
    lines = code.split('\n')
    if len(lines) == 1:
        # Already single line - check if it has comments
        if '//' not in code and '/*' not in code:
            return code.strip()
        # Has comments but is single line - might be URL-encoded, be careful
        # Only remove comments if they're clearly not part of the code
        if '%2F%2F' in code or '%2F%2A' in code:
            # URL-encoded comments - don't process, return as-is
            return code.strip()
    
    # Check if code is URL-encoded (contains % patterns)
    # URL-encoded bookmarklets should not be minified further
    if re.search(r'%[0-9A-Fa-f]{2}', code):
        # URL-encoded code - just remove any non-encoded comments and return
        # Remove non-encoded single-line comments
        lines = []
        for line in code.split('\n'):
            # Only remove // comments that are clearly comments (not in strings)
            # Simple heuristic: if line starts with whitespace and //, it's a comment
            stripped = line.strip()
            if stripped.startswith('//') and not stripped.startswith('javascript:'):
                continue  # Skip comment lines
            lines.append(line)
        return '\n'.join(lines).strip()
    
    # Normal code - remove comments and minify
    # Remove single-line comments (// ...) but preserve URLs like http:// or https://
    processed_lines = []
    for line in code.split('\n'):
        # Check if line contains http:// or https://
        if '://' in line:
            # For lines with URLs, only remove comments that come after the URL part
            if '//' in line:
                url_match = re.search(r'https?://', line)
                if url_match:
                    url_end = url_match.end()
                    before_url = line[:url_end]
                    after_url = line[url_end:]
                    # Remove comments from after_url part
                    after_url = re.sub(r'//.*$', '', after_url)
                    line = before_url + after_url
                else:
                    line = re.sub(r'//.*$', '', line)
        else:
            # No URL, safe to remove comment
            line = re.sub(r'//.*$', '', line)
        processed_lines.append(line.strip())
    
    # Remove multi-line comments (/* ... */)
    code = '\n'.join(processed_lines)
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    
    # Join all lines into a single line, preserving single spaces
    # Filter out empty lines first
    lines = [line for line in code.split('\n') if line.strip()]
    minified = ' '.join(lines)
    
    # Clean up multiple spaces (but preserve spaces in string literals)
    # Only collapse spaces that are clearly not in strings
    minified = re.sub(r' +', ' ', minified)
    
    return minified.strip()

def read_bookmarklet_file(filepath):
    """Read a bookmarklet file, minify it, and return its content."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read().strip()
            # Minify the code (remove comments, compress whitespace)
            return minify_bookmarklet_code(code)
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
    
    # Generate JavaScript array - use json.dumps on the entire array
    # This properly escapes all special characters including quotes, newlines, etc.
    # Use indent=2 for readability, but we'll format it properly for JavaScript
    js_array_string = json.dumps(bookmarklets, ensure_ascii=False, indent=2)
    
    # The JSON string is valid, but we need to ensure it's properly formatted
    # when inserted into JavaScript. The indent=2 creates readable JSON which
    # is also valid JavaScript (JSON is a subset of JavaScript).
    
    # Read the current bookmarklets.js
    try:
        with open(js_file, 'r', encoding='utf-8') as f:
            js_content = f.read()
    except Exception as e:
        print(f"Error reading {js_file}: {e}")
        return False
    
    # Replace the EMBEDDED_BOOKMARKLETS constant
    import re
    # Match the entire constant declaration including the array
    pattern = r'const EMBEDDED_BOOKMARKLETS = \[[\s\S]*?\];'
    replacement = f'const EMBEDDED_BOOKMARKLETS = {js_array_string};'
    
    new_js_content = re.sub(pattern, replacement, js_content)
    
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

