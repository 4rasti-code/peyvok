import json

# Update Android build.gradle
with open('android/app/build.gradle', 'r') as f:
    content = f.read()
content = content.replace('versionCode 311', 'versionCode 312')
content = content.replace('versionName "3.1.1"', 'versionName "3.1.2"')
with open('android/app/build.gradle', 'w') as f:
    f.write(content)

# Update package.json
with open('package.json', 'r') as f:
    data = json.load(f)
data['version'] = '3.1.2'
with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)

# Update SettingsModal.jsx
with open('src/components/SettingsModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('Peyvok v3.1.1', 'Peyvok v3.1.2')
with open('src/components/SettingsModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Update UpdateNotesModal.jsx
with open('src/components/UpdateNotesModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("UPDATE_VERSION = 'v3.1.1'", "UPDATE_VERSION = 'v3.1.2'")
with open('src/components/UpdateNotesModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Versions updated to 3.1.2 (build 312) in all files")
