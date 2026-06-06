"""批量下载上海图书馆开放数据集"""
import urllib.request
import os
import sys
import time

BASE = "https://opendata.library.sh.cn"
OUT = "D:/Projects/cultural-vein/data"
os.makedirs(OUT, exist_ok=True)

FILES = [
    # 数据集 zip
    ("/download/opendata/2024/南京图书馆2024.zip", "南京图书馆2024.zip"),
    ("/download/opendata/2024/南湖文献数据.rar", "南湖文献数据.rar"),
    ("/download/opendata/2024/深圳图书馆2024.zip", "深圳图书馆2024.zip"),
    ("/download/opendata/2025/复旦大学图书馆.zip", "复旦大学图书馆.zip"),
    ("/download/opendata/2024/人大数据下载地址.zip", "人大数据下载地址.zip"),

    # API 文档 PDF
    ("/download/docs/2026/上海图书馆开放数据竞赛-全国报刊索引开放数据接口（API）说明书.pdf",
     "API_全国报刊索引.pdf"),
    ("/download/opendata/2023/搜韵网知识图谱Web API 开放接口.pdf",
     "API_搜韵网知识图谱.pdf"),
    ("/download/opendata/2022/Artlib世界艺术鉴赏库Api接口文档.pdf",
     "API_Artlib世界艺术鉴赏库.pdf"),
    ("/download/opendata/2024/上海图书馆开放数据竞赛-宋庆龄文献数据中心开放数据接口（API）说明书.pdf",
     "API_宋庆龄文献.pdf"),
    ("/download/opendata/2024/韬奋纪念馆2024（0701更新）.pdf",
     "API_韬奋纪念馆.pdf"),

    # 专题片（各区）
    ("/download/opendata/2022/专题片数据.rar", "专题片_静安非遗.rar"),   # 静安区 - 后面下载会冲突，先跳过
]

# 专题片需要特殊处理（同名不同内容），各区分别下载
DISTRICT_FILMS = {
    "静安": "/download/opendata/2022/专题片数据.rar",
    # 注意：URL相同但内容不同无法区分，实际上官网的专题片链接是同一个URL
    # 跳过重复的专题片下载，只下一个
}

# 去重：去掉重复的专题片链接，只保留一个
FILES = [
    ("/download/opendata/2024/南京图书馆2024.zip", "南京图书馆2024.zip"),
    ("/download/opendata/2024/南湖文献数据.rar", "南湖文献数据.rar"),
    ("/download/opendata/2024/深圳图书馆2024.zip", "深圳图书馆2024.zip"),
    ("/download/opendata/2025/复旦大学图书馆.zip", "复旦大学图书馆.zip"),
    ("/download/opendata/2024/人大数据下载地址.zip", "人大数据下载地址.zip"),
    ("/download/docs/2026/上海图书馆开放数据竞赛-全国报刊索引开放数据接口（API）说明书.pdf",
     "API_全国报刊索引.pdf"),
    ("/download/opendata/2023/搜韵网知识图谱Web API 开放接口.pdf",
     "API_搜韵网知识图谱.pdf"),
    ("/download/opendata/2022/Artlib世界艺术鉴赏库Api接口文档.pdf",
     "API_Artlib世界艺术鉴赏库.pdf"),
    ("/download/opendata/2024/上海图书馆开放数据竞赛-宋庆龄文献数据中心开放数据接口（API）说明书.pdf",
     "API_宋庆龄文献.pdf"),
    ("/download/opendata/2024/韬奋纪念馆2024（0701更新）.pdf",
     "API_韬奋纪念馆.pdf"),
    ("/download/opendata/2022/专题片数据.rar", "专题片数据.rar"),
]

def download(url_path, filename):
    url = BASE + url_path
    dest = os.path.join(OUT, filename)

    if os.path.exists(dest):
        size = os.path.getsize(dest)
        print(f"  [SKIP] {filename} ({size:,} bytes) already exists")
        return True

    print(f"  [DL]   {filename} <- {url}")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            total = int(resp.headers.get("Content-Length", 0))
            downloaded = 0
            with open(dest, "wb") as f:
                while True:
                    chunk = resp.read(1024 * 1024)  # 1MB chunks
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total:
                        pct = downloaded / total * 100
                        print(f"\r         {downloaded:,}/{total:,} bytes ({pct:.1f}%)", end="", flush=True)
            print(f"\r  [OK]   {filename} ({downloaded:,} bytes)          ")
            return True
    except Exception as e:
        print(f"\r  [ERR]  {filename}: {e}")
        if os.path.exists(dest):
            os.remove(dest)
        return False

print(f"=== 下载上海图书馆开放数据集 ===")
print(f"目标目录: {OUT}\n")

ok = 0
fail = 0
for url_path, filename in FILES:
    if download(url_path, filename):
        ok += 1
    else:
        fail += 1
    time.sleep(0.5)

print(f"\n=== 完成: {ok} 成功, {fail} 失败 ===")
