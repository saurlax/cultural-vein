"""Export real-world cultural vein supplements from downloaded datasets.

This script currently focuses on two reliable sources already present in /data:
1. CBDB SQLite dump for historical person metadata
2. Shanghai Library 2026 Excel package for activity / circulation samples

The output is a small checked-in JSON artifact that can enrich the demo graph
without requiring the full raw datasets at runtime.
"""

from __future__ import annotations

import json
import sqlite3
import zipfile
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
TMP_DIR = ROOT / "tmp_cbdb"
OUT_DIR = ROOT / "src" / "data" / "generated"
OUT_FILE = OUT_DIR / "real-supplements.json"
WORK_DIR = ROOT / "tmp_generated"

CBDB_DB = TMP_DIR / "CBDB_20240208.db"
SL_ZIP = DATA_DIR / "上海图书馆开放数据2026.zip"

DEMO_BOOKS = [
    {
        "id": "book-shijing",
        "slug": "shijing",
        "title": "诗经",
        "shortTitle": "诗经",
        "dynasty": "先秦",
        "year": -700,
        "category": "经",
        "school": "儒家经典",
        "influence": 98,
        "velocity": 0.28,
        "branchLevel": 0,
        "summary": "中国最早的诗歌总集，是后世经学、诗学与礼乐思想的重要源头。",
        "concepts": ["诗", "礼", "兴观群怨", "教化"],
        "coordinates": [-10, 0.8, 0],
    },
    {
        "id": "book-liji",
        "slug": "liji",
        "title": "礼记",
        "shortTitle": "礼记",
        "dynasty": "两汉",
        "year": 80,
        "category": "经",
        "school": "儒家经典",
        "influence": 84,
        "velocity": 0.36,
        "branchLevel": 0,
        "summary": "系统呈现礼制与思想传统，是宋代理学重新诠释经典的重要入口。",
        "concepts": ["礼", "大学", "中庸", "教化"],
        "coordinates": [-5, 0.4, 0.6],
    },
    {
        "id": "book-shiji",
        "slug": "shiji",
        "title": "史记",
        "shortTitle": "史记",
        "dynasty": "两汉",
        "year": -91,
        "category": "史",
        "school": "纪传史学",
        "influence": 88,
        "velocity": 0.22,
        "branchLevel": 1,
        "summary": "纪传体通史奠基之作，影响史学叙述与人物书写传统。",
        "concepts": ["史", "人物", "叙事", "纪传"],
        "coordinates": [-4, -0.6, -0.8],
    },
    {
        "id": "book-lunyu-jizhu",
        "slug": "lunyu-jizhu",
        "title": "论语集注",
        "shortTitle": "论语集注",
        "dynasty": "宋元",
        "year": 1170,
        "category": "经",
        "school": "理学",
        "influence": 93,
        "velocity": 0.52,
        "branchLevel": 1,
        "summary": "朱熹重构四书诠释秩序的核心典籍，代表宋代理学分流的主河段。",
        "concepts": ["仁", "礼", "理学", "四书"],
        "coordinates": [2, 0.2, 0.9],
    },
    {
        "id": "book-sishu-zhangju",
        "slug": "sishu-zhangju",
        "title": "四书章句集注",
        "shortTitle": "四书章句",
        "dynasty": "宋元",
        "year": 1189,
        "category": "经",
        "school": "理学",
        "influence": 96,
        "velocity": 0.58,
        "branchLevel": 0,
        "summary": "整合《大学》《中庸》《论语》《孟子》的经典解释框架，形成千年主流教材。",
        "concepts": ["仁", "礼", "大学", "中庸", "修身"],
        "coordinates": [4, 0.6, 0.1],
    },
    {
        "id": "book-zi-zhi-tong-jian",
        "slug": "zi-zhi-tong-jian",
        "title": "资治通鉴",
        "shortTitle": "资治通鉴",
        "dynasty": "宋元",
        "year": 1084,
        "category": "史",
        "school": "编年史学",
        "influence": 85,
        "velocity": 0.34,
        "branchLevel": 1,
        "summary": "编年通史典范，连接政治史叙述与注释、续编传统。",
        "concepts": ["史", "治道", "鉴戒", "编年"],
        "coordinates": [1, -0.4, -0.7],
    },
    {
        "id": "book-ri-zhi-lu",
        "slug": "ri-zhi-lu",
        "title": "日知录",
        "shortTitle": "日知录",
        "dynasty": "明清",
        "year": 1670,
        "category": "子",
        "school": "考据学",
        "influence": 72,
        "velocity": 0.42,
        "branchLevel": 2,
        "summary": "顾炎武以经史考据回应时代问题，承接宋学又开清代朴学支流。",
        "concepts": ["经世", "考据", "治学", "礼"],
        "coordinates": [7, -0.15, 0.7],
    },
    {
        "id": "book-ren-jian-ci-hua",
        "slug": "ren-jian-ci-hua",
        "title": "人间词话",
        "shortTitle": "人间词话",
        "dynasty": "近现代",
        "year": 1908,
        "category": "集",
        "school": "近代诗学",
        "influence": 64,
        "velocity": 0.49,
        "branchLevel": 2,
        "summary": "以近代视角重释古典诗学，把经典意象与现代审美重新接续。",
        "concepts": ["境界", "诗学", "词", "审美"],
        "coordinates": [10, 0.1, -0.3],
    },
]

DEMO_CITATIONS = [
    {
        "id": "edge-1",
        "source": "book-liji",
        "target": "book-shijing",
        "layer": "metadata",
        "confidence": 1,
        "label": "经学承续",
        "evidence": "《礼记》多篇引《诗》以明礼乐教化。",
    },
    {
        "id": "edge-2",
        "source": "book-lunyu-jizhu",
        "target": "book-liji",
        "layer": "explicit",
        "confidence": 0.92,
        "label": "显式引礼",
        "evidence": "引《大学》《中庸》并以礼学框架重释论语义理。",
    },
    {
        "id": "edge-3",
        "source": "book-sishu-zhangju",
        "target": "book-lunyu-jizhu",
        "layer": "metadata",
        "confidence": 1,
        "label": "注疏汇流",
        "evidence": "四书系统化整合《论语集注》核心解释。",
    },
    {
        "id": "edge-4",
        "source": "book-sishu-zhangju",
        "target": "book-shijing",
        "layer": "semantic",
        "confidence": 0.74,
        "label": "诗教化用",
        "evidence": "关于教化与修身的表述与《诗经》训诂传统相互呼应。",
    },
    {
        "id": "edge-5",
        "source": "book-zi-zhi-tong-jian",
        "target": "book-shiji",
        "layer": "metadata",
        "confidence": 1,
        "label": "史法承继",
        "evidence": "纪传与叙事判断延续《史记》史学传统。",
    },
    {
        "id": "edge-6",
        "source": "book-ri-zhi-lu",
        "target": "book-sishu-zhangju",
        "layer": "semantic",
        "confidence": 0.68,
        "label": "经世反思",
        "evidence": "以考据之学回应理学训释，形成批评性继承。",
    },
    {
        "id": "edge-7",
        "source": "book-ren-jian-ci-hua",
        "target": "book-shijing",
        "layer": "influence",
        "confidence": 0.56,
        "label": "诗学影响",
        "evidence": "境界说吸收诗教与比兴传统。",
    },
]

TARGET_PEOPLE = {
    "朱熹": {"role": "作者", "aliases": ["朱熹"]},
    "孔颖达": {"role": "注者", "aliases": ["孔颖达", "孔穎達"]},
    "司马光": {"role": "作者", "aliases": ["司马光", "司馬光"]},
    "顾炎武": {"role": "作者", "aliases": ["顾炎武", "顧炎武"]},
    "王国维": {"role": "评论者", "aliases": ["王国维", "王國維"]},
}


def ensure_out_dir() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    WORK_DIR.mkdir(parents=True, exist_ok=True)


def fetch_cbdb_people() -> list[dict[str, object]]:
    if not CBDB_DB.exists():
      raise FileNotFoundError(f"Missing CBDB database: {CBDB_DB}")

    conn = sqlite3.connect(CBDB_DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    people: list[dict[str, object]] = []

    for name, meta in TARGET_PEOPLE.items():
        row = None
        matched_alias = None
        for alias in meta["aliases"]:
            cur.execute(
                """
                SELECT
                  b.c_personid,
                  b.c_name_chn,
                  b.c_birthyear,
                  b.c_deathyear,
                  d.c_dynasty_chn,
                  b.c_notes
                FROM BIOG_MAIN b
                LEFT JOIN DYNASTIES d ON b.c_dy = d.c_dy
                WHERE b.c_name_chn = ?
                LIMIT 1
                """,
                (alias,),
            )
            row = cur.fetchone()
            if row is not None:
                matched_alias = alias
                break

        if row is None:
            people.append(
                {
                    "name": name,
                    "role": meta["role"],
                    "foundInCbdb": False,
                    "aliasesTried": meta["aliases"],
                }
            )
            continue

        note = (row["c_notes"] or "").replace("\x7f", " ").strip()
        people.append(
            {
                "id": f"cbdb-{row['c_personid']}",
                "name": row["c_name_chn"],
                "role": meta["role"],
                "birthYear": row["c_birthyear"] or None,
                "deathYear": row["c_deathyear"] or None,
                "era": row["c_dynasty_chn"] or "未详",
                "bio": note[:160] if note else "",
                "foundInCbdb": True,
                "matchedAlias": matched_alias,
            }
        )

    return people


def fetch_cbdb_summary() -> dict[str, object]:
    if not CBDB_DB.exists():
        return {"available": False, "reason": "db missing"}

    conn = sqlite3.connect(CBDB_DB)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM BIOG_MAIN")
    person_count = cur.fetchone()[0]

    cur.execute(
        """
        SELECT d.c_dynasty_chn, COUNT(*)
        FROM BIOG_MAIN b
        LEFT JOIN DYNASTIES d ON b.c_dy = d.c_dy
        GROUP BY d.c_dynasty_chn
        ORDER BY COUNT(*) DESC
        LIMIT 8
        """
    )
    dynasty_rows = cur.fetchall()

    return {
        "available": True,
        "personCount": person_count,
        "topDynasties": [
            {"name": row[0] or "未详", "count": row[1]} for row in dynasty_rows
        ],
    }


def fetch_shanghai_activity_sample() -> dict[str, object]:
    if not SL_ZIP.exists():
        return {"available": False, "reason": "zip missing"}

    with zipfile.ZipFile(SL_ZIP) as archive:
        names = [
            name
            for name in archive.namelist()
            if name.lower().endswith(".xlsx")
            and "/._" not in name
            and "__MACOSX" not in name
        ]
        if not names:
            return {"available": False, "reason": "no xlsx files"}

        target_name = names[0]
        extracted = WORK_DIR / "shanghai-library-sample.xlsx"
        with archive.open(target_name) as src, open(extracted, "wb") as dst:
            dst.write(src.read())

        workbook = pd.ExcelFile(extracted)
        sheet_name = workbook.sheet_names[0]
        df = workbook.parse(sheet_name, nrows=8)
        df = df.fillna("")
        records = [
            {key: str(value) if value != "" else "" for key, value in row.items()}
            for row in df.to_dict(orient="records")
        ]

    venue_counts: dict[str, int] = {}
    for record in records:
        venue = str(record.get("场馆名称") or record.get("场馆") or "").strip()
        if venue:
            venue_counts[venue] = venue_counts.get(venue, 0) + 1

    top_venues = [
        {"name": venue, "sampleCount": count}
        for venue, count in sorted(venue_counts.items(), key=lambda item: item[1], reverse=True)
    ]

    return {
        "available": True,
        "sourceWorkbook": Path(target_name).name,
        "sheetName": sheet_name,
        "columns": [str(column) for column in df.columns],
        "topVenues": top_venues,
        "sampleRecords": records[:5],
    }


def main() -> None:
    ensure_out_dir()
    payload = {
        "demoBooks": DEMO_BOOKS,
        "demoCitations": DEMO_CITATIONS,
        "cbdbPeople": fetch_cbdb_people(),
        "cbdbSummary": fetch_cbdb_summary(),
        "shanghaiLibraryActivity": fetch_shanghai_activity_sample(),
    }
    OUT_FILE.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"wrote {OUT_FILE}")


if __name__ == "__main__":
    main()
