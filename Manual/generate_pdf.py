import os
import re
import subprocess
import markdown
import urllib.parse

# Paths
manual_dir = r"c:\Users\DELL XPS\Desktop\BMS\General-BMS\Manual"
md_path = os.path.join(manual_dir, "general-purpose-bms.md")
html_path = os.path.join(manual_dir, "general_purpose_bms_temp.html")
pdf_path = os.path.join(manual_dir, "general-purpose-bms.pdf")

print("Reading general-purpose-bms.md...")
with open(md_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines read: {len(lines)}")

# Preprocess lines to handle alerts and blockquotes
print("Preprocessing markdown...")
processed_lines = []
in_blockquote = False
bq_type = None  # 'note' or 'important'
bq_content = []

for idx, line in enumerate(lines):
    stripped = line.strip()
    if stripped.startswith("> [!NOTE]"):
        in_blockquote = True
        bq_type = "note"
        continue
    elif stripped.startswith("> [!IMPORTANT]"):
        in_blockquote = True
        bq_type = "important"
        continue
    
    if in_blockquote:
        if stripped.startswith(">"):
            content = line.replace(">", "", 1).rstrip()
            if content.startswith(" "):
                content = content[1:]
            bq_content.append(content)
        else:
            # End of blockquote
            inner_md = "\n".join(bq_content)
            inner_html = markdown.markdown(inner_md, extensions=['fenced_code', 'tables'])
            alert_class = f"alert-{bq_type}"
            icon = "ℹ️" if bq_type == "note" else "⚠️"
            title = "Note" if bq_type == "note" else "Important"
            processed_lines.append(f'\n<div class="alert {alert_class}">\n  <div class="alert-title">{icon} {title}</div>\n  <div class="alert-body">{inner_html}</div>\n</div>\n')
            in_blockquote = False
            bq_content = []
            processed_lines.append(line)
    else:
        processed_lines.append(line)

if in_blockquote:
    inner_md = "\n".join(bq_content)
    inner_html = markdown.markdown(inner_md, extensions=['fenced_code', 'tables'])
    alert_class = f"alert-{bq_type}"
    icon = "ℹ️" if bq_type == "note" else "⚠️"
    title = "Note" if bq_type == "note" else "Important"
    processed_lines.append(f'\n<div class="alert {alert_class}">\n  <div class="alert-title">{icon} {title}</div>\n  <div class="alert-body">{inner_html}</div>\n</div>\n')

md_content = "".join(processed_lines)
print(f"Preprocessed content length: {len(md_content)} characters")

# Preprocess image links: match relative links like ![Caption](./Image%20Name.png)
# and convert them to absolute file:/// URLs with styled screenshot containers
def replace_image_url(match):
    caption = match.group(1)
    img_filename_encoded = match.group(2)
    img_filename = urllib.parse.unquote(img_filename_encoded)
    img_path = os.path.join(manual_dir, img_filename)
    file_url = "file:///" + img_path.replace("\\", "/")
    encoded_file = urllib.parse.quote(file_url, safe=":/")
    print(f"Embedding image: {img_filename} -> {encoded_file}")
    return f"""
<div class="screenshot-container">
  <img class="screenshot-image" src="{encoded_file}" alt="{caption}">
  <div class="screenshot-caption">{caption}</div>
</div>
"""

# Regex matches: ![Caption](./Image_Name.png)
md_content = re.sub(r'!\[([^\]]*)\]\(\.\/([^)]+\.png)\)', replace_image_url, md_content)

# Convert markdown content to HTML
print("Converting markdown to HTML...")
html_body = markdown.markdown(md_content, extensions=['fenced_code', 'tables'])
print(f"HTML body length: {len(html_body)} characters")

html_document = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>General-Purpose Business Management System (BMS) User Guide</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700&display=swap');

:root {{
  --primary: #0f172a;
  --primary-light: #f8fafc;
  --accent: #2563eb;
  --accent-light: #eff6ff;
  --text: #334155;
  --text-dark: #0f172a;
  --border: #e2e8f0;
  --success: #16a34a;
  --success-light: #f0fdf4;
  --warning: #d97706;
  --warning-light: #fef3c7;
  --danger: #dc2626;
  --danger-light: #fef2f2;
}}

body {{
  font-family: 'Inter', sans-serif;
  color: var(--text);
  line-height: 1.6;
  font-size: 10.5pt;
  margin: 0;
  padding: 0;
  background-color: white;
}}

@page {{
  size: A4;
  margin: 2cm;
  @bottom-right {{
    content: counter(page);
    font-size: 9pt;
    font-family: 'Inter', sans-serif;
    color: #64748b;
  }}
}}

@media print {{
  body {{
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}
  
  a {{
    text-decoration: none;
    color: var(--accent);
  }}
}}

.container {{
  max-width: 800px;
  margin: 0 auto;
  padding: 0;
}}

/* Cover Page styling */
.cover-page {{
  height: 90vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  page-break-after: always;
  break-after: page;
  padding-top: 5cm;
}}

.cover-title {{
  font-family: 'Outfit', sans-serif;
  font-size: 32pt;
  font-weight: 800;
  color: var(--primary);
  line-height: 1.15;
  margin-bottom: 10px;
}}

.cover-subtitle {{
  font-family: 'Outfit', sans-serif;
  font-size: 18pt;
  font-weight: 500;
  color: var(--accent);
  margin-bottom: 40px;
  border-bottom: 3px solid var(--accent);
  padding-bottom: 20px;
}}

.cover-meta {{
  font-size: 11pt;
  color: #64748b;
  margin-top: auto;
  line-height: 1.8;
}}

/* Headings */
h1 {{
  display: none; /* We use the cover page instead */
}}

h2 {{
  font-family: 'Outfit', sans-serif;
  font-size: 18pt;
  font-weight: 700;
  color: var(--text-dark);
  border-bottom: 2px solid var(--border);
  padding-bottom: 6px;
  margin-top: 40px;
  margin-bottom: 20px;
  page-break-before: always;
  break-before: page;
  page-break-after: avoid;
  break-after: avoid;
}}

/* Suppress page break before the very first H2 section */
.content > h2:first-of-type {{
  page-break-before: avoid;
  break-before: avoid;
  margin-top: 0;
}}

h3 {{
  font-family: 'Outfit', sans-serif;
  font-size: 13.5pt;
  font-weight: 600;
  color: var(--text-dark);
  margin-top: 25px;
  margin-bottom: 12px;
  page-break-after: avoid;
  break-after: avoid;
}}

p {{
  margin-top: 0;
  margin-bottom: 16px;
  text-align: justify;
}}

strong {{
  color: var(--text-dark);
  font-weight: 600;
}}

hr {{
  border: 0;
  height: 1px;
  background: var(--border);
  margin: 30px 0;
}}

/* Lists */
ul, ol {{
  margin-top: 0;
  margin-bottom: 20px;
  padding-left: 22px;
}}

li {{
  margin-bottom: 8px;
}}

/* Alerts */
.alert {{
  margin: 20px 0;
  padding: 16px 20px;
  border-left: 4px solid var(--accent);
  background-color: var(--accent-light);
  border-radius: 0 8px 8px 0;
  page-break-inside: avoid;
  break-inside: avoid;
}}

.alert-title {{
  font-weight: 700;
  font-size: 10.5pt;
  margin-bottom: 8px;
  color: var(--text-dark);
  font-family: 'Outfit', sans-serif;
  display: flex;
  align-items: center;
  gap: 6px;
}}

.alert-body p {{
  margin: 0;
  font-size: 10pt;
  text-align: left;
}}

.alert-note {{
  border-left-color: var(--accent);
  background-color: var(--accent-light);
}}

.alert-important {{
  border-left-color: #d97706;
  background-color: #fffbeb;
}}

/* Code Blocks & Preformatted Text */
pre {{
  background-color: var(--primary-light);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  font-family: 'Fira Code', monospace;
  font-size: 8.5pt;
  line-height: 1.45;
  margin-bottom: 20px;
  white-space: pre;
  page-break-inside: avoid;
  break-inside: avoid;
}}

code {{
  font-family: 'Fira Code', monospace;
  font-size: 9pt;
  background-color: var(--primary-light);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  color: #0f172a;
}}

pre code {{
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  border: none;
  font-size: inherit;
  color: inherit;
}}

/* Tables */
table {{
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
  font-size: 9pt;
  page-break-inside: avoid;
  break-inside: avoid;
}}

th, td {{
  border: 1px solid var(--border);
  padding: 10px 12px;
  text-align: left;
}}

th {{
  background-color: #f1f5f9;
  font-weight: 600;
  color: var(--text-dark);
}}

tr:nth-child(even) {{
  background-color: #f8fafc;
}}

/* Images / Screenshots */
.screenshot-container {{
  margin: 30px 0;
  text-align: center;
  page-break-inside: avoid;
  break-inside: avoid;
}}

.screenshot-image {{
  max-width: 100%;
  max-height: 480px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);
  display: block;
  margin: 0 auto 12px auto;
  object-fit: contain;
}}

.screenshot-caption {{
  font-size: 9.5pt;
  color: #475569;
  font-weight: 600;
  margin-top: 8px;
  font-family: 'Outfit', sans-serif;
}}

.no-image-box {{
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 40px;
  background-color: #f8fafc;
  color: #64748b;
  font-size: 10pt;
  font-style: italic;
  display: inline-block;
  width: 80%;
  box-sizing: border-box;
}}
</style>
</head>
<body>
<div class="container">
  <div class="cover-page">
    <div class="cover-title">General-Purpose Business Management System (BMS)</div>
    <div class="cover-subtitle">Complete User Guide & Operations Manual</div>
    <div class="cover-meta">
      <strong>Product Version:</strong> 1.0.0<br>
      <strong>Document Class:</strong> Operations Manual<br>
      <strong>Release Date:</strong> July 2026<br>
      <strong>Scope:</strong> Core modules, configurations, and administrative workflows
    </div>
  </div>
  
  <div class="content">
    {html_body}
  </div>
</div>
</body>
</html>
"""

print(f"Writing HTML to {html_path}...")
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_document)

print("Calling MS Edge to print HTML to PDF...")
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# Convert html_path to file:// URL for Edge's input
html_url = "file:///" + html_path.replace("\\", "/")
print(f"Input URL for Edge: {html_url}")

args = [
    edge_path,
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--allow-file-access-from-files",
    "--enable-local-file-accesses",
    "--print-to-pdf-no-header",
    f"--print-to-pdf={pdf_path}",
    html_url
]

try:
    result = subprocess.run(args, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    print("PDF generated successfully!")
    print(f"Output PDF file: {pdf_path}")
    print("Script finished. HTML file left for inspection.")
except subprocess.CalledProcessError as e:
    print(f"Failed to generate PDF. Error: {e}")
    print(f"Stdout: {e.stdout}")
    print(f"Stderr: {e.stderr}")
except Exception as ex:
    print(f"An unexpected error occurred: {ex}")
