import re
import os

def count_words(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            return len(re.findall(r'word: "', content))
    except Exception as e:
        return str(e)

print(f"wordList.js: {count_words('src/data/wordList.js')}")
print(f"verbsList.js: {count_words('src/data/verbsList.js')}")
