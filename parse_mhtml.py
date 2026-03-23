import email
import re
import sys

def parse_mhtml(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        msg = email.message_from_file(f)
        
    for part in msg.walk():
        if part.get_content_type() == 'text/html':
            html = part.get_payload(decode=True).decode('utf-8', errors='replace')
            # strip styles and scripts
            html = re.sub(r'<style.*?>.*?</style>', ' ', html, flags=re.DOTALL|re.IGNORECASE)
            html = re.sub(r'<script.*?>.*?</script>', ' ', html, flags=re.DOTALL|re.IGNORECASE)
            html = re.sub(r'<[^>]+>', '\n', html)
            # normalize whitespace to an extent but keep newlines
            html = re.sub(r'[ \t]+', ' ', html)
            html = re.sub(r'\n\s*\n', '\n', html)
            return html
    return "No text/html found"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        text = parse_mhtml(sys.argv[1])
        with open('seo_audit_text.txt', 'w', encoding='utf-8') as f:
            f.write(text)
        print("MHTML parsed successfully to seo_audit_text.txt")
