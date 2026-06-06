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
NJ_ZIP = DATA_DIR / "南京图书馆2024.zip"
FUDAN_ZIP = DATA_DIR / "复旦大学图书馆.zip"
NANHU_RAR = DATA_DIR / "南湖文献数据.rar"
VIDEO_TOPIC_RAR = DATA_DIR / "专题片数据.rar"
SZ_ZIP = DATA_DIR / "深圳图书馆2024.zip"

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
        "id": "book-shangshu",
        "slug": "shangshu",
        "title": "尚书",
        "shortTitle": "尚书",
        "dynasty": "先秦",
        "year": -500,
        "category": "经",
        "school": "儒家经典",
        "influence": 91,
        "velocity": 0.24,
        "branchLevel": 0,
        "summary": "汇集上古政治文告与历史记忆，是治道叙事、经世修辞与正统观念的重要源头。",
        "concepts": ["治道", "政教", "天命", "典章"],
        "coordinates": [-8.2, 0.6, -0.25],
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
        "id": "book-zuozhuan",
        "slug": "zuozhuan",
        "title": "春秋左传",
        "shortTitle": "左传",
        "dynasty": "先秦",
        "year": -350,
        "category": "史",
        "school": "春秋史学",
        "influence": 86,
        "velocity": 0.27,
        "branchLevel": 1,
        "summary": "以叙事化方式展开《春秋》经义，是经史互证与政治事件书写的重要枢纽。",
        "concepts": ["春秋", "史法", "叙事", "礼乐政治"],
        "coordinates": [-2.6, -0.2, -1.1],
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
        "id": "book-mengzi",
        "slug": "mengzi",
        "title": "孟子",
        "shortTitle": "孟子",
        "dynasty": "先秦",
        "year": -300,
        "category": "经",
        "school": "儒家经典",
        "influence": 89,
        "velocity": 0.33,
        "branchLevel": 1,
        "summary": "以性善、王道与民本论述扩展孔门思想，是宋明理学与经世议论反复回流的关键节点。",
        "concepts": ["仁政", "性善", "王道", "民本"],
        "coordinates": [0.8, 0.85, 0.55],
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
        "id": "edge-1a",
        "source": "book-liji",
        "target": "book-shangshu",
        "layer": "metadata",
        "confidence": 1,
        "label": "礼政互证",
        "evidence": "《礼记》中的礼制与政教论述常与《尚书》典章、王命传统相互印证。",
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
        "id": "edge-3a",
        "source": "book-sishu-zhangju",
        "target": "book-mengzi",
        "layer": "metadata",
        "confidence": 1,
        "label": "四书纳入",
        "evidence": "《孟子》作为四书之一，被纳入统一章句体系并成为主流教材。",
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
        "id": "edge-5a",
        "source": "book-shiji",
        "target": "book-zuozhuan",
        "layer": "metadata",
        "confidence": 1,
        "label": "叙事史源",
        "evidence": "《史记》在人物塑造与事件铺陈上吸收《左传》叙事传统。",
    },
    {
        "id": "edge-5b",
        "source": "book-zi-zhi-tong-jian",
        "target": "book-shangshu",
        "layer": "semantic",
        "confidence": 0.78,
        "label": "治道回响",
        "evidence": "《资治通鉴》对君臣政教的编年书写与《尚书》的治道话语形成持续呼应。",
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
    {
        "id": "edge-7a",
        "source": "book-ri-zhi-lu",
        "target": "book-mengzi",
        "layer": "influence",
        "confidence": 0.61,
        "label": "经世对话",
        "evidence": "顾炎武关于天下国家与民生治理的论述，与《孟子》王道民本传统持续对话。",
    },
]

DEMO_BOOK_DETAILS = {
    "shijing": {
        "bookId": "book-shijing",
        "heroMetric": {
            "directCitations": 124,
            "downstreamInfluence": 410,
            "coveredRegions": 6,
        },
        "spread": [
            {
                "id": "spread-1",
                "fromPlaceId": "place-changan",
                "toPlaceId": "place-luoyang",
                "startYear": -100,
                "endYear": 80,
                "volume": 86,
            },
            {
                "id": "spread-2",
                "fromPlaceId": "place-luoyang",
                "toPlaceId": "place-kaifeng",
                "startYear": 960,
                "endYear": 1127,
                "volume": 91,
            },
            {
                "id": "spread-3",
                "fromPlaceId": "place-kaifeng",
                "toPlaceId": "place-linan",
                "startYear": 1127,
                "endYear": 1279,
                "volume": 88,
            },
        ],
        "people": [
            {
                "id": "person-kongyingda",
                "name": "孔颖达",
                "role": "注者",
                "birthYear": 574,
                "deathYear": 648,
                "era": "唐",
                "bio": "奉诏撰《毛诗正义》，奠定经学义疏传统。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 1,
                "relationType": "注",
            },
            {
                "id": "person-zhuxi",
                "name": "朱熹",
                "role": "引用者",
                "birthYear": 1130,
                "deathYear": 1200,
                "era": "宋",
                "bio": "以理学视角重新解释诗教，强化修身与教化内核。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 2,
                "relationType": "引",
            },
            {
                "id": "person-wangguowei",
                "name": "王国维",
                "role": "影响者",
                "birthYear": 1877,
                "deathYear": 1927,
                "era": "清末民初",
                "bio": "近代诗学家，以境界论回接《诗经》传统。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 2,
                "relationType": "评",
            },
        ],
        "places": [
            {"id": "place-changan", "name": "长安", "lat": 34.3416, "lng": 108.9398, "note": "汉唐经学传播中心"},
            {"id": "place-luoyang", "name": "洛阳", "lat": 34.6197, "lng": 112.454, "note": "东汉学术与典籍汇聚地"},
            {"id": "place-kaifeng", "name": "开封", "lat": 34.7972, "lng": 114.3076, "note": "北宋刻书与学校传播节点"},
            {"id": "place-linan", "name": "临安", "lat": 30.2741, "lng": 120.1551, "note": "南宋书院系统中的重要传播终点"},
        ],
        "versions": [
            {
                "id": "version-sj-1",
                "label": "毛诗故训传祖本",
                "year": -150,
                "place": "长安",
                "library": "传抄系统",
                "status": "佚失",
                "editionType": "祖本",
                "note": "西汉经学传授系统中的早期祖本，现仅见于后世著录。",
            },
            {
                "id": "version-sj-2",
                "label": "唐《毛诗正义》刻本",
                "year": 653,
                "place": "长安",
                "library": "国子监",
                "status": "存世",
                "parentId": "version-sj-1",
                "editionType": "刻本",
                "note": "官方义疏体系定型后的刻印版本，奠定唐代经学标准。",
            },
            {
                "id": "version-sj-3",
                "label": "南宋监本",
                "year": 1175,
                "place": "临安",
                "library": "两浙路书局",
                "status": "存世",
                "parentId": "version-sj-2",
                "editionType": "重刊本",
                "note": "伴随书院教育南迁而重刊，成为南宋教学常用本。",
            },
        ],
        "timeline": [
            {"id": "tl-sj-1", "year": -700, "title": "诗篇成编", "detail": "西周至春秋诗歌逐步汇聚为经典文本。"},
            {"id": "tl-sj-2", "year": 653, "title": "《毛诗正义》刊行", "detail": "唐代官方经学注疏系统成形。"},
            {"id": "tl-sj-3", "year": 1175, "title": "南宋监本传播", "detail": "书院教学推动《诗经》南迁传播。"},
        ],
        "passages": [
            {
                "id": "passage-sj-1",
                "section": "关雎",
                "original": "关关雎鸠，在河之洲。窈窕淑女，君子好逑。",
                "links": [
                    {
                        "id": "passage-sj-1-link-1",
                        "quote": "兴于《诗》，立于礼",
                        "sourceBookId": "book-liji",
                        "sourceTitle": "礼记",
                        "layer": "explicit",
                        "confidenceLabel": "高",
                        "evidence": "后世礼学引用《诗》阐释教化次序。",
                    }
                ],
                "tracePath": [
                    {
                        "id": "trace-sj-1",
                        "title": "诗经",
                        "relation": "源头",
                        "note": "原始诗教文本，提供“兴观群怨”的经典母题。",
                    },
                    {
                        "id": "trace-sj-2",
                        "title": "礼记",
                        "relation": "引述",
                        "note": "将《诗》纳入礼乐教化秩序，形成显式引用链。",
                    },
                    {
                        "id": "trace-sj-3",
                        "title": "四书章句集注",
                        "relation": "再诠释",
                        "note": "理学语境下继续把诗教内化为修身工夫。",
                    },
                ],
                "downstreamInfluence": [
                    {
                        "id": "down-sj-1",
                        "targetTitle": "礼记",
                        "relation": "显式引用",
                        "note": "以《诗》证明礼乐教化的先后次序。",
                        "confidenceLabel": "高",
                    },
                    {
                        "id": "down-sj-2",
                        "targetTitle": "人间词话",
                        "relation": "诗学影响",
                        "note": "“境界”理论回收比兴与审美感发传统。",
                        "confidenceLabel": "低",
                    },
                ],
            },
            {
                "id": "passage-sj-2",
                "section": "大雅",
                "original": "周虽旧邦，其命维新。",
                "links": [
                    {
                        "id": "passage-sj-2-link-1",
                        "quote": "革故鼎新与修身进德",
                        "sourceBookId": "book-sishu-zhangju",
                        "sourceTitle": "四书章句集注",
                        "layer": "semantic",
                        "confidenceLabel": "中",
                        "evidence": "理学语境中对“维新”精神作义理化继承。",
                    }
                ],
                "tracePath": [
                    {
                        "id": "trace-sj-4",
                        "title": "诗经",
                        "relation": "源头",
                        "note": "保留“维新”这一经典政治修辞母题。",
                    },
                    {
                        "id": "trace-sj-5",
                        "title": "四书章句集注",
                        "relation": "义理化",
                        "note": "将经典政治修辞改写为修身进德的话语资源。",
                    },
                ],
                "downstreamInfluence": [
                    {
                        "id": "down-sj-3",
                        "targetTitle": "四书章句集注",
                        "relation": "语义关联",
                        "note": "“维新”被重新编码为理学修身路径。",
                        "confidenceLabel": "中",
                    }
                ],
            },
        ],
        "realWorldSignals": {
            "sourceLabel": "CBDB 人物 + 上图活动样本",
        },
    },
    "shangshu": {
        "bookId": "book-shangshu",
        "heroMetric": {
            "directCitations": 88,
            "downstreamInfluence": 268,
            "coveredRegions": 7,
        },
        "spread": [
            {
                "id": "spread-sshu-1",
                "fromPlaceId": "place-haojing",
                "toPlaceId": "place-luoyang",
                "startYear": -400,
                "endYear": 50,
                "volume": 79,
            },
            {
                "id": "spread-sshu-2",
                "fromPlaceId": "place-luoyang",
                "toPlaceId": "place-kaifeng",
                "startYear": 960,
                "endYear": 1127,
                "volume": 76,
            },
            {
                "id": "spread-sshu-3",
                "fromPlaceId": "place-kaifeng",
                "toPlaceId": "place-beijing",
                "startYear": 1271,
                "endYear": 1644,
                "volume": 81,
            },
        ],
        "people": [
            {
                "id": "person-kongyingda-shangshu",
                "name": "孔颖达",
                "role": "注者",
                "birthYear": 574,
                "deathYear": 648,
                "era": "唐",
                "bio": "主持《尚书正义》编纂，使经义与政教解释体系化。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 1,
                "relationType": "注",
            },
            {
                "id": "person-cai-shen",
                "name": "蔡沈",
                "role": "注者",
                "birthYear": 1167,
                "deathYear": 1230,
                "era": "南宋",
                "bio": "撰《书集传》，推动《尚书》进入理学化、治道化的新解释阶段。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 2,
                "relationType": "注",
            },
        ],
        "places": [
            {"id": "place-haojing", "name": "镐京", "lat": 34.2667, "lng": 108.8667, "note": "周代政治记忆与典章叙事的象征起点"},
            {"id": "place-luoyang", "name": "洛阳", "lat": 34.6197, "lng": 112.454, "note": "汉唐经学传播重镇"},
            {"id": "place-kaifeng", "name": "开封", "lat": 34.7972, "lng": 114.3076, "note": "北宋经学重刊与学校传播节点"},
            {"id": "place-beijing", "name": "北京", "lat": 39.9042, "lng": 116.4074, "note": "元明清官方经典教育的核心集散地"},
        ],
        "versions": [
            {
                "id": "version-sshu-1",
                "label": "伏生今文本系统",
                "year": -150,
                "place": "洛阳",
                "library": "经师传授",
                "status": "佚失",
                "editionType": "祖本",
                "note": "汉代今文《尚书》口授与写录系统，是后世传本的重要源头之一。",
            },
            {
                "id": "version-sshu-2",
                "label": "唐《尚书正义》本",
                "year": 653,
                "place": "长安",
                "library": "国子监",
                "status": "存世",
                "parentId": "version-sshu-1",
                "editionType": "刻本",
                "note": "经义与疏解结合后，成为经学教育的标准形态。",
            },
            {
                "id": "version-sshu-3",
                "label": "南宋《书集传》系统",
                "year": 1209,
                "place": "建阳",
                "library": "书坊",
                "status": "存世",
                "parentId": "version-sshu-2",
                "editionType": "重刊本",
                "note": "理学视角重释治道经典，使《尚书》重新汇入宋学主流。",
            },
        ],
        "timeline": [
            {"id": "tl-sshu-1", "year": -150, "title": "今文本传授成形", "detail": "汉代经师系统使《尚书》进入稳定的传授链条。"},
            {"id": "tl-sshu-2", "year": 653, "title": "《尚书正义》成立", "detail": "唐代义疏体系完成，经义解释趋于标准化。"},
            {"id": "tl-sshu-3", "year": 1209, "title": "《书集传》流布", "detail": "南宋理学将《尚书》重新接入治道与修身讨论。"},
        ],
        "passages": [
            {
                "id": "passage-sshu-1",
                "section": "尧典",
                "original": "克明俊德，以亲九族；九族既睦，平章百姓。",
                "links": [
                    {
                        "id": "passage-sshu-1-link-1",
                        "quote": "《礼记》礼治教化",
                        "sourceBookId": "book-liji",
                        "sourceTitle": "礼记",
                        "layer": "semantic",
                        "confidenceLabel": "中",
                        "evidence": "德教与秩序的展开方式与《礼记》礼治逻辑形成互证。",
                    }
                ],
                "tracePath": [
                    {
                        "id": "trace-sshu-1",
                        "title": "尚书",
                        "relation": "治道源典",
                        "note": "提供关于德治、王命与政教秩序的核心话语资源。",
                    },
                    {
                        "id": "trace-sshu-2",
                        "title": "礼记",
                        "relation": "礼制转译",
                        "note": "将政治教化资源转写为更具体的礼制与修身语境。",
                    },
                ],
                "downstreamInfluence": [
                    {
                        "id": "down-sshu-1",
                        "targetTitle": "资治通鉴",
                        "relation": "治道再编年化",
                        "note": "后世史书将《尚书》的治道命题嵌入具体历史事件判断。",
                        "confidenceLabel": "中",
                    }
                ],
            }
        ],
    },
    "sishu-zhangju": {
        "bookId": "book-sishu-zhangju",
        "heroMetric": {
            "directCitations": 97,
            "downstreamInfluence": 288,
            "coveredRegions": 9,
        },
        "spread": [
            {
                "id": "spread-ss-1",
                "fromPlaceId": "place-wuyuan",
                "toPlaceId": "place-kaifeng",
                "startYear": 1190,
                "endYear": 1250,
                "volume": 80,
            },
            {
                "id": "spread-ss-2",
                "fromPlaceId": "place-kaifeng",
                "toPlaceId": "place-beijing",
                "startYear": 1315,
                "endYear": 1644,
                "volume": 96,
            },
        ],
        "people": [
            {
                "id": "person-zhuxi-main",
                "name": "朱熹",
                "role": "作者",
                "birthYear": 1130,
                "deathYear": 1200,
                "era": "南宋",
                "bio": "以四书为核心重新组织儒学经典秩序。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 1,
                "relationType": "著",
            },
            {
                "id": "person-huxian",
                "name": "胡炫",
                "role": "校者",
                "birthYear": 1230,
                "deathYear": 1295,
                "era": "元",
                "bio": "参与元代学宫刻本的校勘整理。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 2,
                "relationType": "校",
            },
        ],
        "places": [
            {"id": "place-wuyuan", "name": "婺源", "lat": 29.247, "lng": 117.8622, "note": "朱熹学脉活动地"},
            {"id": "place-kaifeng", "name": "开封", "lat": 34.7972, "lng": 114.3076, "note": "北方学宫转译节点"},
            {"id": "place-beijing", "name": "北京", "lat": 39.9042, "lng": 116.4074, "note": "明清科举教材集散地"},
        ],
        "versions": [
            {
                "id": "version-ss-1",
                "label": "淳熙刊本",
                "year": 1189,
                "place": "建阳",
                "library": "书坊",
                "status": "佚失",
                "editionType": "祖本",
                "note": "朱熹体系初步定型后的早期刊本，今已难见原貌。",
            },
            {
                "id": "version-ss-2",
                "label": "元学宫本",
                "year": 1315,
                "place": "大都",
                "library": "国子学",
                "status": "存世",
                "parentId": "version-ss-1",
                "editionType": "刻本",
                "note": "纳入官方教育系统后形成的标准教学版本。",
            },
            {
                "id": "version-ss-3",
                "label": "明内府本",
                "year": 1468,
                "place": "北京",
                "library": "内府",
                "status": "存世",
                "parentId": "version-ss-2",
                "editionType": "重刊本",
                "note": "明代重刊整理后广泛流入科举与书院教育。",
            },
        ],
        "timeline": [
            {"id": "tl-ss-1", "year": 1189, "title": "四书体系定型", "detail": "《四书章句集注》成书并广泛流传。"},
            {"id": "tl-ss-2", "year": 1315, "title": "进入科举体系", "detail": "元代以四书义理为官方考试核心。"},
            {"id": "tl-ss-3", "year": 1468, "title": "内府重刊", "detail": "明代形成覆盖全国的标准教材版本。"},
        ],
        "passages": [
            {
                "id": "passage-ss-1",
                "section": "大学章句",
                "original": "大学之道，在明明德，在亲民，在止于至善。",
                "links": [
                    {
                        "id": "passage-ss-1-link-1",
                        "quote": "《礼记》大学篇",
                        "sourceBookId": "book-liji",
                        "sourceTitle": "礼记",
                        "layer": "explicit",
                        "confidenceLabel": "高",
                        "evidence": "直接承接《礼记》篇目并加章句诠释。",
                    }
                ],
                "tracePath": [
                    {
                        "id": "trace-ss-1",
                        "title": "礼记",
                        "relation": "原篇",
                        "note": "《大学》原属《礼记》，提供直接文本源头。",
                    },
                    {
                        "id": "trace-ss-2",
                        "title": "四书章句集注",
                        "relation": "章句重构",
                        "note": "朱熹将其转化为科举与理学学习的核心入口。",
                    },
                ],
                "downstreamInfluence": [
                    {
                        "id": "down-ss-1",
                        "targetTitle": "明内府本四书章句",
                        "relation": "版本扩散",
                        "note": "随着重刊进入更广的教学体系。",
                        "confidenceLabel": "高",
                    }
                ],
            },
            {
                "id": "passage-ss-2",
                "section": "论语集注汇入",
                "original": "仁者，以天地万物为一体。",
                "links": [
                    {
                        "id": "passage-ss-2-link-1",
                        "quote": "理学心性论扩展",
                        "sourceBookId": "book-lunyu-jizhu",
                        "sourceTitle": "论语集注",
                        "layer": "semantic",
                        "confidenceLabel": "中",
                        "evidence": "由论语义理延伸出系统化心性论表达。",
                    }
                ],
                "tracePath": [
                    {
                        "id": "trace-ss-3",
                        "title": "论语集注",
                        "relation": "义理基础",
                        "note": "提供关于仁与心性的解释框架。",
                    },
                    {
                        "id": "trace-ss-4",
                        "title": "四书章句集注",
                        "relation": "体系整合",
                        "note": "把原本分散的义理整合为统一学习路径。",
                    },
                ],
                "downstreamInfluence": [
                    {
                        "id": "down-ss-2",
                        "targetTitle": "日知录",
                        "relation": "批评性承继",
                        "note": "清代学者沿着理学框架展开反思与修正。",
                        "confidenceLabel": "中",
                    }
                ],
            },
        ],
        "realWorldSignals": {
            "sourceLabel": "CBDB 人物 + 上图活动样本",
        },
    },
    "shiji": {
        "bookId": "book-shiji",
        "heroMetric": {
            "directCitations": 82,
            "downstreamInfluence": 236,
            "coveredRegions": 5,
        },
        "spread": [],
        "people": [
            {
                "id": "person-simaqian",
                "name": "司马迁",
                "role": "作者",
                "birthYear": -145,
                "deathYear": -86,
                "era": "西汉",
                "bio": "纪传体史学奠基者，以人物书写重构历史叙述。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 1,
                "relationType": "著",
            }
        ],
        "places": [],
        "versions": [
            {
                "id": "version-shiji-1",
                "label": "西汉写本系统",
                "year": -80,
                "place": "长安",
                "library": "太史公家传",
                "status": "佚失",
                "editionType": "祖本",
                "note": "《史记》早期写本流传系统，后世多依其衍生。",
            },
            {
                "id": "version-shiji-2",
                "label": "南宋绍兴刊本",
                "year": 1145,
                "place": "临安",
                "library": "官刻系统",
                "status": "存世",
                "parentId": "version-shiji-1",
                "editionType": "刻本",
                "note": "南宋整理刻印后，成为后世通行底本之一。",
            },
        ],
        "timeline": [
            {"id": "tl-shiji-1", "year": -91, "title": "《史记》定稿", "detail": "司马迁完成纪传体通史的历史叙述框架。"}
        ],
        "passages": [],
    },
    "zuozhuan": {
        "bookId": "book-zuozhuan",
        "heroMetric": {
            "directCitations": 79,
            "downstreamInfluence": 218,
            "coveredRegions": 5,
        },
        "spread": [
            {
                "id": "spread-zzh-1",
                "fromPlaceId": "place-lu-state",
                "toPlaceId": "place-luoyang",
                "startYear": -300,
                "endYear": 200,
                "volume": 68,
            },
            {
                "id": "spread-zzh-2",
                "fromPlaceId": "place-luoyang",
                "toPlaceId": "place-changan",
                "startYear": 600,
                "endYear": 750,
                "volume": 73,
            },
        ],
        "people": [
            {
                "id": "person-zuoqiuming",
                "name": "左丘明",
                "role": "作者",
                "birthYear": -556,
                "deathYear": -451,
                "era": "春秋",
                "bio": "传统上被视为《左传》作者，象征春秋史事叙述的源头。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 1,
                "relationType": "著",
            },
            {
                "id": "person-duyu",
                "name": "杜预",
                "role": "注者",
                "birthYear": 222,
                "deathYear": 285,
                "era": "西晋",
                "bio": "《春秋左氏经传集解》奠定后世阅读《左传》的重要注释底本。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 2,
                "relationType": "注",
            },
        ],
        "places": [
            {"id": "place-lu-state", "name": "鲁地", "lat": 35.6, "lng": 117.0, "note": "春秋史事叙述的文化原场"},
            {"id": "place-luoyang", "name": "洛阳", "lat": 34.6197, "lng": 112.454, "note": "两汉经史文献聚合地"},
            {"id": "place-changan", "name": "长安", "lat": 34.3416, "lng": 108.9398, "note": "唐代义疏与经典教育中心"},
        ],
        "versions": [
            {
                "id": "version-zzh-1",
                "label": "古写本系统",
                "year": -100,
                "place": "洛阳",
                "library": "传抄系统",
                "status": "佚失",
                "editionType": "祖本",
                "note": "秦汉之际形成的写本流传系统，今多赖后出注本追索。",
            },
            {
                "id": "version-zzh-2",
                "label": "杜预集解本",
                "year": 285,
                "place": "洛阳",
                "library": "私家注本",
                "status": "存世",
                "parentId": "version-zzh-1",
                "editionType": "刻本",
                "note": "以注文统摄史事，是后世《左传》学习的核心入口。",
            },
            {
                "id": "version-zzh-3",
                "label": "唐石经系统",
                "year": 837,
                "place": "长安",
                "library": "太学",
                "status": "存世",
                "parentId": "version-zzh-2",
                "editionType": "重刊本",
                "note": "进入官方经典系统后，促进经史合流的长期传播。",
            },
        ],
        "timeline": [
            {"id": "tl-zzh-1", "year": -300, "title": "叙事传统成型", "detail": "《左传》以历史事件铺陈《春秋》经义，形成经史互证典范。"},
            {"id": "tl-zzh-2", "year": 285, "title": "杜预集解", "detail": "西晋注释系统让《左传》获得更稳定的阅读框架。"},
            {"id": "tl-zzh-3", "year": 837, "title": "纳入石经体系", "detail": "唐代官方经典化推动其进入更广阔的教育网络。"},
        ],
        "passages": [
            {
                "id": "passage-zzh-1",
                "section": "僖公叙事",
                "original": "国之大事，在祀与戎。",
                "links": [
                    {
                        "id": "passage-zzh-1-link-1",
                        "quote": "《史记》事件与制度叙事",
                        "sourceBookId": "book-shiji",
                        "sourceTitle": "史记",
                        "layer": "influence",
                        "confidenceLabel": "低",
                        "evidence": "后世史学在叙事节奏与政治判断上延续《左传》传统。",
                    }
                ],
                "tracePath": [
                    {
                        "id": "trace-zzh-1",
                        "title": "春秋左传",
                        "relation": "事件叙事原型",
                        "note": "把礼乐政治与战争、外交事件编织成连续叙事。",
                    },
                    {
                        "id": "trace-zzh-2",
                        "title": "史记",
                        "relation": "史家扩写",
                        "note": "司马迁将事件判断扩充为人物与时代并进的宏大叙述。",
                    },
                ],
                "downstreamInfluence": [
                    {
                        "id": "down-zzh-1",
                        "targetTitle": "资治通鉴",
                        "relation": "编年史学回流",
                        "note": "经史互证传统继续影响后世编年体的政治判断。",
                        "confidenceLabel": "中",
                    }
                ],
            }
        ],
    },
    "mengzi": {
        "bookId": "book-mengzi",
        "heroMetric": {
            "directCitations": 92,
            "downstreamInfluence": 276,
            "coveredRegions": 8,
        },
        "spread": [
            {
                "id": "spread-mz-1",
                "fromPlaceId": "place-zou",
                "toPlaceId": "place-luoyang",
                "startYear": -200,
                "endYear": 100,
                "volume": 74,
            },
            {
                "id": "spread-mz-2",
                "fromPlaceId": "place-luoyang",
                "toPlaceId": "place-jianyang",
                "startYear": 1100,
                "endYear": 1250,
                "volume": 88,
            },
            {
                "id": "spread-mz-3",
                "fromPlaceId": "place-jianyang",
                "toPlaceId": "place-beijing",
                "startYear": 1315,
                "endYear": 1644,
                "volume": 93,
            },
        ],
        "people": [
            {
                "id": "person-mengke",
                "name": "孟子",
                "role": "作者",
                "birthYear": -372,
                "deathYear": -289,
                "era": "战国",
                "bio": "以仁政、王道与性善学说扩展儒家政治伦理话语。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 1,
                "relationType": "著",
            },
            {
                "id": "person-zhuxi-mengzi",
                "name": "朱熹",
                "role": "注者",
                "birthYear": 1130,
                "deathYear": 1200,
                "era": "南宋",
                "bio": "通过章句系统将《孟子》推入四书核心结构，强化其理学入口地位。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 2,
                "relationType": "注",
            },
        ],
        "places": [
            {"id": "place-zou", "name": "邹鲁", "lat": 35.4006, "lng": 116.9656, "note": "孟子思想的文化原点"},
            {"id": "place-luoyang", "name": "洛阳", "lat": 34.6197, "lng": 112.454, "note": "汉唐经学传播的重要枢纽"},
            {"id": "place-jianyang", "name": "建阳", "lat": 27.3327, "lng": 118.1227, "note": "宋元书坊与理学文献的关键刊刻地"},
            {"id": "place-beijing", "name": "北京", "lat": 39.9042, "lng": 116.4074, "note": "明清官方教育与科举体系终端"},
        ],
        "versions": [
            {
                "id": "version-mz-1",
                "label": "汉传写本系统",
                "year": -50,
                "place": "洛阳",
                "library": "经师传钞",
                "status": "佚失",
                "editionType": "祖本",
                "note": "汉代形成的早期传写链，是后出注本的重要基础。",
            },
            {
                "id": "version-mz-2",
                "label": "宋刊章句本",
                "year": 1190,
                "place": "建阳",
                "library": "书坊",
                "status": "存世",
                "parentId": "version-mz-1",
                "editionType": "刻本",
                "note": "朱熹章句使《孟子》转化为标准化教学文本。",
            },
            {
                "id": "version-mz-3",
                "label": "明学宫重刊本",
                "year": 1437,
                "place": "北京",
                "library": "国子监",
                "status": "存世",
                "parentId": "version-mz-2",
                "editionType": "重刊本",
                "note": "科举教育中的重刊推动《孟子》影响进一步下沉扩散。",
            },
        ],
        "timeline": [
            {"id": "tl-mz-1", "year": -300, "title": "《孟子》成书", "detail": "仁政、性善与王道论述被整理为稳定经典文本。"},
            {"id": "tl-mz-2", "year": 1190, "title": "章句体系传播", "detail": "朱熹章句让《孟子》进入更强的标准化解释框架。"},
            {"id": "tl-mz-3", "year": 1315, "title": "纳入官方考试核心", "detail": "四书体系确立后，《孟子》成为长期教育主干。"},
        ],
        "passages": [
            {
                "id": "passage-mz-1",
                "section": "梁惠王上",
                "original": "王何必曰利？亦有仁义而已矣。",
                "links": [
                    {
                        "id": "passage-mz-1-link-1",
                        "quote": "《四书章句集注》义理重释",
                        "sourceBookId": "book-sishu-zhangju",
                        "sourceTitle": "四书章句集注",
                        "layer": "explicit",
                        "confidenceLabel": "高",
                        "evidence": "朱熹章句直接将《孟子》纳入四书义理体系。",
                    },
                    {
                        "id": "passage-mz-1-link-2",
                        "quote": "《日知录》经世关怀",
                        "sourceBookId": "book-ri-zhi-lu",
                        "sourceTitle": "日知录",
                        "layer": "semantic",
                        "confidenceLabel": "中",
                        "evidence": "后世经世思想持续回到仁义与利害之辨。",
                    }
                ],
                "tracePath": [
                    {
                        "id": "trace-mz-1",
                        "title": "孟子",
                        "relation": "民本源语",
                        "note": "提出王道、仁政与利义之辨的经典表达。",
                    },
                    {
                        "id": "trace-mz-2",
                        "title": "四书章句集注",
                        "relation": "章句经典化",
                        "note": "通过章句体系将其转换为可广泛教学的主干文本。",
                    },
                    {
                        "id": "trace-mz-3",
                        "title": "日知录",
                        "relation": "经世反思",
                        "note": "清代学术把孟子义理重新拉回现实政治与制度问题。",
                    },
                ],
                "downstreamInfluence": [
                    {
                        "id": "down-mz-1",
                        "targetTitle": "四书章句集注",
                        "relation": "教材核心",
                        "note": "作为四书之一持续影响后世学习路径与价值秩序。",
                        "confidenceLabel": "高",
                    }
                ],
            }
        ],
    },
    "zi-zhi-tong-jian": {
        "bookId": "book-zi-zhi-tong-jian",
        "heroMetric": {
            "directCitations": 90,
            "downstreamInfluence": 260,
            "coveredRegions": 6,
        },
        "spread": [],
        "people": [
            {
                "id": "person-simaguang",
                "name": "司马光",
                "role": "作者",
                "birthYear": 1019,
                "deathYear": 1086,
                "era": "宋",
                "bio": "主持编纂《资治通鉴》，以编年体方式重塑治道叙事。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 1,
                "relationType": "著",
            },
            {
                "id": "person-liushu",
                "name": "刘恕",
                "role": "编纂者",
                "birthYear": 1032,
                "deathYear": 1078,
                "era": "宋",
                "bio": "通鉴局重要助手，负责资料搜辑与校勘。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 2,
                "relationType": "校",
            },
        ],
        "places": [],
        "versions": [
            {
                "id": "version-zz-1",
                "label": "宋刻初印本",
                "year": 1084,
                "place": "开封",
                "library": "通鉴局",
                "status": "佚失",
                "editionType": "祖本",
                "note": "编纂完成后最早的刻印形态，后世著录多有提及。",
            },
            {
                "id": "version-zz-2",
                "label": "元刻递修本",
                "year": 1312,
                "place": "大都",
                "library": "书坊",
                "status": "存世",
                "parentId": "version-zz-1",
                "editionType": "重刊本",
                "note": "递修过程中加入校勘成果，便于持续流传。",
            },
            {
                "id": "version-zz-3",
                "label": "清整理本",
                "year": 1736,
                "place": "北京",
                "library": "内府校刊",
                "status": "存世",
                "parentId": "version-zz-2",
                "editionType": "整理本",
                "note": "清代整理后形成更加稳定的阅读与校勘底本。",
            },
        ],
        "timeline": [
            {"id": "tl-zz-1", "year": 1084, "title": "《资治通鉴》成书", "detail": "编年体通史完成，形成治道鉴戒的核心文本。"}
        ],
        "passages": [],
    },
    "ri-zhi-lu": {
        "bookId": "book-ri-zhi-lu",
        "heroMetric": {
            "directCitations": 61,
            "downstreamInfluence": 154,
            "coveredRegions": 4,
        },
        "spread": [],
        "people": [
            {
                "id": "person-guyanwu",
                "name": "顾炎武",
                "role": "作者",
                "birthYear": 1613,
                "deathYear": 1682,
                "era": "明清",
                "bio": "以考据与经世之学贯通经史，开启清代朴学风气。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 1,
                "relationType": "著",
            }
        ],
        "places": [],
        "versions": [
            {
                "id": "version-rzl-1",
                "label": "顾氏手稿本",
                "year": 1670,
                "place": "昆山",
                "library": "顾氏家藏",
                "status": "佚失",
                "editionType": "祖本",
                "note": "作者手稿阶段的原始形态，今仅由著录与后本反推。",
            },
            {
                "id": "version-rzl-2",
                "label": "清抄本",
                "year": 1685,
                "place": "江南",
                "library": "私家藏书楼",
                "status": "存世",
                "parentId": "version-rzl-1",
                "editionType": "抄本",
                "note": "私家传播链中的重要抄本，保留较早层次的文字痕迹。",
            },
            {
                "id": "version-rzl-3",
                "label": "清刻本",
                "year": 1742,
                "place": "苏州",
                "library": "书坊刊本",
                "status": "存世",
                "parentId": "version-rzl-2",
                "editionType": "刻本",
                "note": "经抄本整理后刻印，推动考据学文本更广泛流通。",
            },
        ],
        "timeline": [
            {"id": "tl-rzl-1", "year": 1670, "title": "《日知录》成书", "detail": "顾炎武以札记体展开经世与考据思考。"}
        ],
        "passages": [],
    },
    "ren-jian-ci-hua": {
        "bookId": "book-ren-jian-ci-hua",
        "heroMetric": {
            "directCitations": 48,
            "downstreamInfluence": 118,
            "coveredRegions": 3,
        },
        "spread": [],
        "people": [
            {
                "id": "person-wangguowei-main",
                "name": "王国维",
                "role": "作者",
                "birthYear": 1877,
                "deathYear": 1927,
                "era": "清末民初",
                "bio": "以境界论重释古典诗学，连接近代审美与经史传统。",
                "source": "demo",
                "sourceStatus": "fallback",
                "relationTier": 1,
                "relationType": "著",
            }
        ],
        "places": [],
        "versions": [
            {
                "id": "version-rjch-1",
                "label": "手稿辑录本",
                "year": 1908,
                "place": "北京",
                "library": "作者手稿",
                "status": "佚失",
                "editionType": "祖本",
                "note": "王国维最早的手稿与刊载材料，后经整理成册。",
            },
            {
                "id": "version-rjch-2",
                "label": "民初铅印本",
                "year": 1910,
                "place": "上海",
                "library": "商务印书馆系统",
                "status": "存世",
                "parentId": "version-rjch-1",
                "editionType": "整理本",
                "note": "民初传播广泛的成册整理版本，进入现代阅读视野。",
            },
        ],
        "timeline": [
            {"id": "tl-rjch-1", "year": 1908, "title": "《人间词话》问世", "detail": "以境界说重塑近代诗词批评话语。"}
        ],
        "passages": [],
    },
}

TARGET_PEOPLE = {
    "朱熹": {"role": "作者", "aliases": ["朱熹"]},
    "孔颖达": {"role": "注者", "aliases": ["孔颖达", "孔穎達"]},
    "蔡沈": {"role": "注者", "aliases": ["蔡沈"]},
    "司马迁": {"role": "作者", "aliases": ["司马迁", "司馬遷"]},
    "司马光": {"role": "作者", "aliases": ["司马光", "司馬光"]},
    "刘恕": {"role": "编纂者", "aliases": ["刘恕", "劉恕"]},
    "孟子": {"role": "作者", "aliases": ["孟子", "孟轲", "孟軻"]},
    "顾炎武": {"role": "作者", "aliases": ["顾炎武", "顧炎武"]},
    "王国维": {"role": "评论者", "aliases": ["王国维", "王國維"]},
}

BOOK_PERSON_LINKS = {
    "shijing": ["孔穎達", "朱熹", "王國維"],
    "shangshu": ["孔穎達", "蔡沈"],
    "sishu-zhangju": ["朱熹"],
    "shiji": ["司馬遷"],
    "mengzi": ["孟子", "朱熹"],
    "zi-zhi-tong-jian": ["司馬光", "劉恕"],
    "ri-zhi-lu": ["顧炎武"],
    "ren-jian-ci-hua": ["王國維"],
}


def fetch_person_activity_places(cur: sqlite3.Cursor, person_id: int) -> list[dict[str, object]]:
    cur.execute(
        """
        SELECT
          a.c_name_chn,
          b.c_firstyear,
          b.c_lastyear,
          b.c_notes
        FROM BIOG_ADDR_DATA b
        LEFT JOIN ADDR_CODES a ON b.c_addr_id = a.c_addr_id
        WHERE b.c_personid = ?
          AND a.c_name_chn IS NOT NULL
          AND a.c_name_chn NOT IN ('[未詳]', '[信息缺乏]')
        ORDER BY
          CASE WHEN b.c_firstyear IS NULL OR b.c_firstyear = 0 THEN 1 ELSE 0 END,
          b.c_firstyear,
          b.c_lastyear,
          b.c_sequence
        LIMIT 4
        """,
        (person_id,),
    )
    rows = cur.fetchall()
    results: list[dict[str, object]] = []
    seen: set[str] = set()

    for row in rows:
        place_name = row["c_name_chn"]
        if not place_name or place_name in seen:
            continue
        seen.add(place_name)
        note = (row["c_notes"] or "").replace("\x7f", " ").strip()
        results.append(
            {
                "name": place_name,
                "firstYear": row["c_firstyear"] or None,
                "lastYear": row["c_lastyear"] or None,
                "note": note[:80] if note else "",
            }
        )

    return results


def build_cbdb_timeline_events(person: dict[str, object]) -> list[dict[str, object]]:
    events: list[dict[str, object]] = []
    person_name = str(person.get("name") or "")

    for index, place in enumerate(person.get("activityPlaces") or []):
        year = place.get("firstYear") or place.get("lastYear")
        if not year or int(year) == 0:
            continue

        note = str(place.get("note") or "").strip()
        detail = f"{person_name}在{place['name']}留下活动地点记录。"
        if note:
            detail = f"{detail}{note}"

        events.append(
            {
                "id": f"cbdb-{person_name}-{index}",
                "year": int(year),
                "title": f"{person_name}活动于{place['name']}",
                "detail": detail[:140],
                "source": "cbdb",
            }
        )

    return events[:3]


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
                "activityPlaces": fetch_person_activity_places(cur, row["c_personid"]),
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


def parse_tagged_records(text: str) -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    current: dict[str, str] = {}

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("<REC>"):
            if current:
                records.append(current)
                current = {}
            continue
        if line.startswith("<") and ">" in line:
            key, _, value = line.partition(">")
            current[key[1:]] = value.strip().lstrip("=")

    if current:
        records.append(current)

    return records


def fetch_nanjing_library_sample() -> dict[str, object]:
    if not NJ_ZIP.exists():
        return {"available": False, "reason": "zip missing"}

    with zipfile.ZipFile(NJ_ZIP) as archive:
        txt_names = [
            name for name in archive.namelist() if name.endswith(".txt") and "URL" not in name
        ]
        if not txt_names:
            return {"available": False, "reason": "no txt files"}

        records: list[dict[str, str]] = []
        for name in txt_names:
            content = archive.read(name).decode("gb18030", errors="ignore")
            records.extend(parse_tagged_records(content)[:3])

    sample_records = []
    for record in records[:6]:
        sample_records.append(
            {
                "institution": "南京图书馆",
                "title": record.get("题名", ""),
                "category": record.get("分类名", ""),
                "year": record.get("作品日期", "") or record.get("出版日期", ""),
                "imageRef": record.get("图像", ""),
                "sourceText": record.get("图像出处", ""),
            }
        )

    return {
        "available": True,
        "institution": "南京图书馆",
        "recordCount": len(records),
        "sampleTitles": [item["title"] for item in sample_records[:4] if item["title"]],
        "sampleRecords": sample_records,
    }


def fetch_fudan_archive_sample() -> dict[str, object]:
    if not FUDAN_ZIP.exists():
        return {"available": False, "reason": "zip missing"}

    with zipfile.ZipFile(FUDAN_ZIP) as archive:
        intro_doc = next(
            (name for name in archive.namelist() if name.endswith("介紹.docx")),
            None,
        )
        if not intro_doc:
            return {"available": False, "reason": "intro doc missing"}

        with archive.open(intro_doc) as src:
            docx_bytes = src.read()

    from xml.etree import ElementTree
    import io

    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as docx_archive:
        xml = docx_archive.read("word/document.xml")

    root = ElementTree.fromstring(xml)
    texts = []
    for elem in root.iter():
        if elem.tag.endswith("}t") and elem.text:
            texts.append(elem.text)

    text = "".join(texts)
    summary = text[:260]

    return {
        "available": True,
        "institution": "复旦大学图书馆",
        "collectionTitle": "南社诗笺样例",
        "summary": summary,
        "sampleRecords": [
            {
                "institution": "复旦大学图书馆",
                "title": "南社诗笺",
                "category": "手稿 / 诗笺",
                "year": "1909",
                "sourceText": summary,
            }
        ],
    }


def fetch_nanhu_archive_sample() -> dict[str, object]:
    if not NANHU_RAR.exists():
        return {"available": False, "reason": "rar missing"}

    import subprocess

    list_result = subprocess.run(
        ["7z", "l", "-ba", str(NANHU_RAR)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
        check=False,
    )
    if list_result.returncode != 0:
        return {"available": False, "reason": "7z list failed"}

    lines = [line.strip() for line in list_result.stdout.splitlines() if line.strip()]
    file_paths: list[str] = []
    image_count = 0
    doc_count = 0
    docx_candidate = None

    for line in lines:
        parts = line.split()
        if len(parts) < 6:
            continue
        path = " ".join(parts[5:])
        if path.lower().endswith((".doc", ".docx", ".txt")):
            doc_count += 1
            file_paths.append(path)
        if path.lower().endswith((".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp")):
            image_count += 1
            file_paths.append(path)
        if docx_candidate is None and path.lower().endswith(".docx"):
            docx_candidate = path

    summary = ""
    if docx_candidate:
        extract_dir = WORK_DIR / "nanhu_extract"
        extract_dir.mkdir(parents=True, exist_ok=True)
        extract_result = subprocess.run(
            ["7z", "e", "-y", f"-o{extract_dir}", str(NANHU_RAR), docx_candidate],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            check=False,
        )
        if extract_result.returncode == 0:
            extracted_docx = extract_dir / Path(docx_candidate).name
            if extracted_docx.exists():
                from xml.etree import ElementTree
                import io

                with zipfile.ZipFile(io.BytesIO(extracted_docx.read_bytes())) as docx_archive:
                    xml = docx_archive.read("word/document.xml")

                root = ElementTree.fromstring(xml)
                texts = []
                for elem in root.iter():
                    if elem.tag.endswith("}t") and elem.text:
                        texts.append(elem.text)
                summary = "".join(texts)[:240]

    sample_paths = sorted(set(file_paths))[:6]
    sample_records = [
        {
            "institution": "南湖文献数据库",
            "title": Path(path).stem[:80],
            "category": "专题文献 / 图像资源" if Path(path).suffix.lower() in {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp"} else "专题文献",
            "year": "",
            "imageRef": Path(path).name if Path(path).suffix.lower() in {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp"} else "",
            "sourceText": path[:180],
        }
        for path in sample_paths
    ]

    return {
        "available": True,
        "institution": "南湖文献数据库",
        "collectionTitle": "专题文献与图像资源样本",
        "documentCount": doc_count,
        "imageCount": image_count,
        "summary": summary or "已发现可稳定列举的专题文献与图片资源，可作为专题分支样本接入。",
        "sampleRecords": sample_records,
    }


def read_docx_text(path: Path) -> str:
    from xml.etree import ElementTree
    import io

    with zipfile.ZipFile(io.BytesIO(path.read_bytes())) as docx_archive:
        xml = docx_archive.read("word/document.xml")

    root = ElementTree.fromstring(xml)
    texts = []
    for elem in root.iter():
        if elem.tag.endswith("}t") and elem.text:
            texts.append(elem.text)
    return "".join(texts)


def fetch_video_topic_sample() -> dict[str, object]:
    if not VIDEO_TOPIC_RAR.exists():
        return {"available": False, "reason": "rar missing"}

    import subprocess

    extract_dir = WORK_DIR / "video_topic_extract"
    extract_dir.mkdir(parents=True, exist_ok=True)
    extract_result = subprocess.run(
        ["7z", "e", "-y", str(VIDEO_TOPIC_RAR), f"-o{extract_dir}"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
        check=False,
    )
    if extract_result.returncode != 0:
        return {"available": False, "reason": "7z extract failed"}

    intro_doc = extract_dir / "数据介绍.docx"
    access_doc = extract_dir / "专题片数据访问方式.docx"
    if not intro_doc.exists():
        return {"available": False, "reason": "intro doc missing"}

    intro_text = read_docx_text(intro_doc)
    access_text = read_docx_text(access_doc) if access_doc.exists() else ""
    summary = intro_text[:260]

    sample_titles = []
    for marker in [
        "石纯农：为病患者的一生",
        "舞担擎石论勇武",
        "月份牌的故事",
        "调香师的故事",
        "马桥手狮舞",
        "七宝皮影画",
    ]:
        if marker in intro_text:
            sample_titles.append(marker)

    sample_records = [
        {
            "institution": "近代上海城市文化专题片",
            "title": title,
            "category": "专题片 / 影像资源",
            "year": "",
            "imageRef": "",
            "sourceText": "来自《近代上海城市文化》专题片数据介绍文档。",
        }
        for title in sample_titles[:6]
    ]

    return {
        "available": True,
        "institution": "近代上海城市文化专题片",
        "collectionTitle": "近代上海城市文化影像样本",
        "summary": summary,
        "accessNote": access_text[:140],
        "sampleTitles": sample_titles[:6],
        "sampleRecords": sample_records,
    }


def fetch_shenzhen_library_sample() -> dict[str, object]:
    if not SZ_ZIP.exists():
        return {"available": False, "reason": "zip missing"}

    import io
    from xml.etree import ElementTree

    def read_docx_text(blob: bytes) -> str:
        with zipfile.ZipFile(io.BytesIO(blob)) as docx_archive:
            xml = docx_archive.read("word/document.xml")
        root = ElementTree.fromstring(xml)
        texts = []
        for elem in root.iter():
            if elem.tag.endswith("}t") and elem.text:
                texts.append(elem.text)
        return "".join(texts)

    with zipfile.ZipFile(SZ_ZIP) as archive:
        memory_doc = None
        sculpture_doc = None
        for name in archive.namelist():
            if "深圳记忆专题库" in name and name.lower().endswith(".docx"):
                memory_doc = archive.read(name)
            if "深圳城市景观雕塑数据库" in name and name.lower().endswith(".docx"):
                sculpture_doc = archive.read(name)

    if not memory_doc and not sculpture_doc:
        return {"available": False, "reason": "docx missing"}

    memory_text = read_docx_text(memory_doc) if memory_doc else ""
    sculpture_text = read_docx_text(sculpture_doc) if sculpture_doc else ""

    sample_records = []
    if memory_text:
        sample_records.append(
            {
                "institution": "深圳图书馆",
                "title": "深圳记忆专题库 API",
                "category": "专题影像 / 图片 / 视频",
                "year": "2024",
                "imageRef": "",
                "sourceText": "支持题名、类别、区域、作品时间、作者、相关人物、相关活动等字段抽取。",
            }
        )
    if sculpture_text:
        sample_records.append(
            {
                "institution": "深圳图书馆",
                "title": "深圳城市景观雕塑数据库 API",
                "category": "城市景观 / 雕塑知识",
                "year": "2024",
                "imageRef": "",
                "sourceText": "支持题名、作品时间、雕塑位置、经纬度、作品类型、材质、所在城市等字段抽取。",
            }
        )

    sample_titles = [record["title"] for record in sample_records]
    summary_parts = []
    if memory_text:
        summary_parts.append("深圳记忆专题库可提供题名、类别、区域、时间、作者、相关人物与活动等专题记忆字段。")
    if sculpture_text:
        summary_parts.append("城市景观雕塑数据库可提供位置、经纬度、作品时间、材质与城市空间描述等字段。")

    return {
        "available": True,
        "institution": "深圳图书馆",
        "collectionTitle": "深圳专题文化接口样本",
        "summary": "".join(summary_parts)[:260],
        "sampleTitles": sample_titles,
        "sampleRecords": sample_records,
    }


def main() -> None:
    ensure_out_dir()
    cbdb_people = fetch_cbdb_people()
    cbdb_timeline_map = {
        person["name"]: build_cbdb_timeline_events(person)
        for person in cbdb_people
        if person.get("foundInCbdb")
    }

    demo_book_details = json.loads(json.dumps(DEMO_BOOK_DETAILS, ensure_ascii=False))
    for slug, linked_people in BOOK_PERSON_LINKS.items():
        detail = demo_book_details.get(slug)
        if not detail:
            continue

        cbdb_events: list[dict[str, object]] = []
        for person_name in linked_people:
            cbdb_events.extend(cbdb_timeline_map.get(person_name, []))

        if cbdb_events:
            merged = detail.get("timeline", []) + cbdb_events
            merged.sort(key=lambda item: item.get("year", 999999))
            detail["timeline"] = merged[:6]

    payload = {
        "demoBooks": DEMO_BOOKS,
        "demoCitations": DEMO_CITATIONS,
        "demoBookDetails": demo_book_details,
        "cbdbPeople": cbdb_people,
        "cbdbSummary": fetch_cbdb_summary(),
        "shanghaiLibraryActivity": fetch_shanghai_activity_sample(),
        "nanjingLibrarySample": fetch_nanjing_library_sample(),
        "fudanArchiveSample": fetch_fudan_archive_sample(),
        "nanhuArchiveSample": fetch_nanhu_archive_sample(),
        "videoTopicSample": fetch_video_topic_sample(),
        "shenzhenLibrarySample": fetch_shenzhen_library_sample(),
    }
    OUT_FILE.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"wrote {OUT_FILE}")


if __name__ == "__main__":
    main()
