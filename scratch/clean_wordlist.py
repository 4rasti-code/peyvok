import re

file_path = r'd:\Peyivcin App\src\data\wordList.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace English letters inside hint strings
# We search for lines like hint: "..." and replace d, n, b, j, h, l inside the quotes
def clean_hint(match):
    hint_text = match.group(1)
    # Replacements
    hint_text = hint_text.replace('d', 'د')
    hint_text = hint_text.replace('n', 'ن')
    hint_text = hint_text.replace('b', 'ب')
    hint_text = hint_text.replace('j', 'ج')
    # Be careful with 'h' as it might be part of Kurdish 'ھ' or 'هـ'
    # But usually in hints it should be Kurdish
    hint_text = hint_text.replace('h', 'ھ') 
    return f'hint: "{hint_text}"'

# Regex to find hint properties
cleaned_content = re.sub(r'hint: "([^"]*)"', clean_hint, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(cleaned_content)

print("Cleaned successfully.")
