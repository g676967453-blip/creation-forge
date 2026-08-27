import sys
from pypdf import PdfReader

pdf_path = r"C:\Users\admin\Desktop\AI游戏从立项到制作到变现_完整三章_v1_20260818221129.pdf"
out_path = r"J:\ceshi\extracted_pdf.txt"

reader = PdfReader(pdf_path)
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(f"PDF总页数: {len(reader.pages)}\n\n")
    for i, page in enumerate(reader.pages, 1):
        text = page.extract_text()
        f.write(f"===== 第 {i} 页 =====\n")
        f.write(text if text else "（本页无文本或文本无法提取）")
        f.write("\n\n")
print("extraction done, pages:", len(reader.pages))
