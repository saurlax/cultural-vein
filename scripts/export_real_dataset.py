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

TARGET_PEOPLE = {
    "朱熹": {"role": "作者"},
    "孔颖达": {"role": "注者"},
    "司马光": {"role": "作者"},
    "顾炎武": {"role": "作者"},
    "王国维": {"role": "评论者"},
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
            (name,),
        )
        row = cur.fetchone()

        if row is None:
            people.append(
                {
                    "name": name,
                    "role": meta["role"],
                    "foundInCbdb": False,
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
            }
        )

    return people


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
        "cbdbPeople": fetch_cbdb_people(),
        "shanghaiLibraryActivity": fetch_shanghai_activity_sample(),
    }
    OUT_FILE.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"wrote {OUT_FILE}")


if __name__ == "__main__":
    main()
