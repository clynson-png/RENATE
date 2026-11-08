#!/usr/bin/env python3
"""Reconcile the three specifically authorized PDF/OCR pairs and build a
test-only, reference-based ATLAS golden-set manifest for RENATE Day 1.

Run from any working directory with Python 3.10+: python scripts/day1_reconcile.py
All inputs and outputs are rooted below this script's RENATE directory.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPORT = ROOT / "data/imports/day1_2026-11-06"
MANIFEST = ROOT / "library/manifest.csv"
ALLOWLIST = IMPORT / "sources/source_metadata_allowlist.json"
ATLAS = IMPORT / "atlas/atlas_qa_route_candidates_2026-11-06.jsonl"
ALPHAOMEGA = IMPORT / "atlas/alphaomega_question_association_2026-11-06.jsonl"
GOLDEN = IMPORT / "pretests/atlas_golden_set_manifest_2026-11-06.json"
SOURCE_BINDINGS = IMPORT / "atlas/atlas_source_bindings_2026-11-06.jsonl"

PAIRS = {
    "ADANA-DERIVED-11BC52259F71C331": {
        "title": "WSPS Rulebook_Tracked Changes from 2022 to 2026",
        "pdf": "library/documents/ADANA-DERIVED-11BC52259F71C331/WSPS Rulebook_Tracked Changes from 2022 to 2026.pdf",
        "ocr": "library/ocr/ADANA-DERIVED-11BC52259F71C331/wsps__wsps_rulebook_tracked_changes_from_2022_to_2026.ocr.txt",
        "edition": "PDF impression: World Shooting Para Sport Technical Rules and Regulations (2022-2024), v2, v1; filename/title identifies tracked changes through 2026",
        "locator": "See referenced rule locators listed per ATLAS record",
    },
    "ADANA-DERIVED-48C60F9FAC964B12": {
        "title": "Carabina WRABF (Benchrest)",
        "pdf": "library/documents/ADANA-DERIVED-48C60F9FAC964B12/Regulamento-Carabina-WRABF-30012020.pdf",
        "ocr": "library/ocr/ADANA-DERIVED-48C60F9FAC964B12/handoff__regulamento_prova_carabina_wrabf_e_benchrest.ocr.txt",
        "edition": "Atualizado em 30/01/2020",
        "locator": "p. 2, II Divisões, Carabina WRABF Ar Comprimido — Unlimited",
    },
    "ADANA-DERIVED-85D550478960EDF8": {
        "title": "9 - Duelo 20 Segundos",
        "pdf": "library/documents/ADANA-DERIVED-85D550478960EDF8/Regulamento-Duelo-20s-02012025.pdf",
        "ocr": "library/ocr/ADANA-DERIVED-85D550478960EDF8/library__9_duelo_20_segundos.ocr.txt",
        "edition": "Atualizado em 02/01/2025",
        "locator": "PDF pp. 1–4; ATLAS records do not carry an exact passage locator",
    },
}

LOCAL_EDITION_STATEMENTS = {
    "ADANA-SRC-06396C98372AB6D1": "ISSF Edition 2025, Second Print 07/2026; effective 1 July 2026",
    "ADANA-SRC-230B81C6286AE94E": "Atualizado em 23/12/2024",
    "ADANA-SRC-277F6EDC18262298": "Regulamento Geral Trap Nacional 2026; atualizado em 01/01/2026",
    "ADANA-SRC-3A7909C4D514E2B8": "ISSF Edition 2025, Second Print 07/2026; effective 1 July 2026",
    "ADANA-SRC-3B1650384F55C206": "WSPS Rulebook Appendices 2026, vFinal (edition shown in document title)",
    "ADANA-SRC-5AD016EBD99EEDAA": "Planejamento Técnico CAR/PST 2026; atualizado em 10/12/2025",
    "ADANA-SRC-7914789A181774E9": "Regulamento Geral CAR/PST/RF 2026; atualizado em 30/12/2025",
    "ADANA-SRC-892D95743F291E6F": "WSPS Rulebook 2026 vFinal; effective 01 January 2026",
    "ADANA-SRC-8F6C57074DE63477": "WRABF Rules 2023-2027, revision 05 May 2026, v4.4",
    "ADANA-SRC-AA64B7BC76972EE0": "Regulamento Geral de Tiro ao Prato 2025/2028; revisado em 19/12/2024",
    "ADANA-SRC-C320971D06D9EC3E": "Criado em 19/11/2020",
    "ADANA-SRC-DCE52A1EC62622EB": "Livro de Ouro do Paradesporto, edição 2023 (ficha catalográfica impressa no PDF)",
    "ADANA-SRC-E9D7DC1442865DD0": "2027 ATA Rulebook; effective 01 September 2026; reprinted 01 September 2026",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def normalized_question(question: str) -> str:
    text = unicodedata.normalize("NFKD", question.casefold())
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return " ".join(re.findall(r"[a-z0-9]+", text))


def main() -> None:
    if not ROOT.is_dir():
        raise SystemExit(f"RENATE root missing: {ROOT}")

    records = [json.loads(line) for line in ATLAS.read_text(encoding="utf-8").splitlines() if line.strip()]
    alpha_records = [json.loads(line) for line in ALPHAOMEGA.read_text(encoding="utf-8").splitlines() if line.strip()]
    alpha_routes = {record["atlas_id"]: record.get("renate_supplemental_route_id") for record in alpha_records}
    by_id = {record["atlas_id"]: record for record in records}
    if len(by_id) != len(records):
        raise SystemExit("Duplicate atlas_id in source snapshot")

    with MANIFEST.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        fieldnames = reader.fieldnames
        rows = list(reader)
    if not fieldnames:
        raise SystemExit("Manifest has no header")

    existing = {(row["document_source_id"], row["artifact_kind"]): row for row in rows}
    pair_audit = []
    for source_id, info in PAIRS.items():
        pdf_path = ROOT / info["pdf"]
        ocr_path = ROOT / info["ocr"]
        if not pdf_path.is_file() or not ocr_path.is_file():
            raise SystemExit(f"Missing RENATE-local PDF/OCR for {source_id}")
        pdf_hash = sha256(pdf_path)
        ocr_hash = sha256(ocr_path)
        referenced = [r for r in records if source_id in r.get("source_ids", [])]
        locators = sorted({locator for r in referenced for locator in r.get("rule_locators", [])})
        route_ids = sorted({
            route
            for record in referenced
            for route in (record.get("route_ids", []) + ([alpha_routes[record["atlas_id"]]] if alpha_routes.get(record["atlas_id"]) else []))
        })
        refs = sorted({r["atlas_id"] for r in referenced})

        ocr_row = existing.get((source_id, "ocr"))
        if ocr_row is None or ocr_row["local_ocr_path"].replace("\\", "/") != info["ocr"]:
            raise SystemExit(f"Unexpected OCR manifest row for {source_id}")
        ocr_row["local_pdf_path"] = info["pdf"]
        ocr_row["pdf_sha256_observed"] = pdf_hash
        ocr_row["edition"] = info["edition"]
        ocr_row["page_or_locator"] = "; ".join(locators) if locators else info["locator"]
        ocr_row["referenced_by"] = "; ".join(route_ids)
        ocr_row["collection_status"] = "USER_AUTHORIZED_COPY_HASH_VERIFIED_2026-11-06"

        doc_row = existing.get((source_id, "documents"))
        if doc_row is None:
            doc_row = {key: "" for key in fieldnames}
            doc_row.update({
                "source_id": source_id,
                "document_source_id": source_id,
                "artifact_kind": "documents",
                "title": info["title"],
                "local_pdf_path": info["pdf"],
                "pdf_sha256_observed": pdf_hash,
                "edition": info["edition"],
                "page_or_locator": "; ".join(locators) if locators else info["locator"],
                "referenced_by": "; ".join(route_ids),
                "license_status": "USER_CONFIRMED_NO_LEGAL_RESTRICTION",
                "collection_status": "USER_AUTHORIZED_COPY_HASH_VERIFIED_2026-11-06",
                "record_type": "USER_AUTHORIZED_PDF_SOURCE",
                "citation_status": "LOCAL_COPY_HASH_VERIFIED",
            })
            rows.append(doc_row)
            existing[(source_id, "documents")] = doc_row
        else:
            doc_row.update({
                "title": info["title"],
                "local_pdf_path": info["pdf"],
                "pdf_sha256_observed": pdf_hash,
                "edition": info["edition"],
                "page_or_locator": "; ".join(locators) if locators else info["locator"],
                "referenced_by": "; ".join(route_ids),
                "collection_status": "USER_AUTHORIZED_COPY_HASH_VERIFIED_2026-11-06",
            })
        pair_audit.append({
            "document_source_id": source_id,
            "title": info["title"],
            "pdf_path": info["pdf"],
            "pdf_sha256": pdf_hash,
            "ocr_path": info["ocr"],
            "ocr_sha256": ocr_hash,
            "edition": info["edition"],
            "atlas_reference_count": len(refs),
            "atlas_ids": refs,
            "locators": locators,
            "renate_routes": route_ids,
        })

    for row in rows:
        document_id = row["document_source_id"]
        if document_id in LOCAL_EDITION_STATEMENTS:
            row["edition"] = LOCAL_EDITION_STATEMENTS[document_id]

    with MANIFEST.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    documents_by_id = {
        row["document_source_id"]: row for row in rows if row["artifact_kind"] == "documents"
    }
    ocr_by_source = {
        row["source_id"]: row for row in rows if row["artifact_kind"] == "ocr"
    }
    ocrs_by_document: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        if row["artifact_kind"] == "ocr":
            ocrs_by_document[row["document_source_id"]].append(row)
    bindings = []
    unresolved = []
    for record in sorted(records, key=lambda r: r["atlas_id"]):
        reference_ids = set(record.get("source_ids", []))
        reference_ids.update(ref.get("source_id", "") for ref in record.get("source_references", []))
        reference_ids.discard("")
        for source_id in sorted(reference_ids):
            ocr_row = ocr_by_source.get(source_id)
            document_id = source_id if source_id in documents_by_id else (ocr_row or {}).get("document_source_id", "")
            document_row = documents_by_id.get(document_id)
            if document_row is None:
                unresolved.append({"atlas_id": record["atlas_id"], "source_id": source_id})
                bindings.append({
                    "atlas_id": record["atlas_id"],
                    "source_id": source_id,
                    "status": "UNRESOLVED_LOCAL_SOURCE",
                    "renate_pdf_path": None,
                    "pdf_sha256": None,
                    "ocr_paths": [],
                    "edition": None,
                    "locators": sorted({
                        ref.get("locator", "") for ref in record.get("source_references", [])
                        if ref.get("source_id") == source_id and ref.get("locator")
                    } | set(record.get("rule_locators", []))),
                })
                continue
            bindings.append({
                "atlas_id": record["atlas_id"],
                "source_id": source_id,
                "document_source_id": document_id,
                "status": "RESOLVED_TO_RENATE_LIBRARY",
                "renate_pdf_path": document_row["local_pdf_path"],
                "pdf_sha256": document_row["pdf_sha256_observed"],
                "ocr_paths": sorted({item["local_ocr_path"] for item in ocrs_by_document.get(document_id, [])}),
                "edition": document_row["edition"],
                "locators": sorted({
                    ref.get("locator", "") for ref in record.get("source_references", [])
                    if ref.get("source_id") == source_id and ref.get("locator")
                } | set(record.get("rule_locators", []))),
            })
    SOURCE_BINDINGS.write_text(
        "".join(json.dumps(item, ensure_ascii=False, sort_keys=True) + "\n" for item in bindings),
        encoding="utf-8",
    )

    allowlist = json.loads(ALLOWLIST.read_text(encoding="utf-8"))
    allowed_sources = allowlist.get("documents", [])
    existing_allowlist_ids = {
        (item.get("source_id"), item.get("format")) for item in allowed_sources
    }
    for pair in pair_audit:
        source_id = pair["document_source_id"]
        if (source_id, "PDF") in existing_allowlist_ids:
            continue
        pdf_path = ROOT / pair["pdf_path"]
        referenced = [r for r in records if source_id in r.get("source_ids", [])]
        route_ids = sorted({
            route
            for record in referenced
            for route in (record.get("route_ids", []) + ([alpha_routes[record["atlas_id"]]] if alpha_routes.get(record["atlas_id"]) else []))
        })
        if not route_ids and source_id == "ADANA-DERIVED-48C60F9FAC964B12":
            route_ids = ["renate.alphaomega"]
        info = PAIRS[source_id]
        allowed_sources.append({
            "source_id": source_id,
            "linked_document_source_id": source_id,
            "record_type": "USER_AUTHORIZED_PDF_SOURCE",
            "format": "PDF",
            "source_relative_path": "user_authorized_exact_name_search",
            "local_path": pair["pdf_path"],
            "bytes": pdf_path.stat().st_size,
            "sha256": pair["pdf_sha256"],
            "title": pair["title"],
            "edition": pair["edition"],
            "citation_status": "LOCAL_COPY_HASH_VERIFIED",
            "redistribution_status": "USER_CONFIRMED_NO_LEGAL_RESTRICTION_2026-11-06",
            "copy_decision": "USER_AUTHORIZED_COPY_TO_RENATE_2026-11-06",
            "user_ocr_approval": "",
            "route_ids": route_ids,
        })
    for item in allowed_sources:
        document_id = item.get("linked_document_source_id", item.get("source_id"))
        if document_id in LOCAL_EDITION_STATEMENTS:
            item["edition"] = LOCAL_EDITION_STATEMENTS[document_id]
            item["edition_basis"] = "VERIFIED_IN_RENATE_LOCAL_PDF_OR_OCR"
    allowed_local_paths = {item.get("local_path", "") for item in allowed_sources}
    documents_by_id = {
        row["document_source_id"]: row for row in rows if row["artifact_kind"] == "documents"
    }
    for row in rows:
        if row["artifact_kind"] != "ocr" or row["local_ocr_path"] in allowed_local_paths:
            continue
        path = ROOT / row["local_ocr_path"]
        parent = documents_by_id[row["document_source_id"]]
        allowed_sources.append({
            "source_id": row["source_id"],
            "linked_document_source_id": row["document_source_id"],
            "record_type": "DERIVED_OCR_FROM_RENATE_LOCAL_PDF",
            "format": "OCR_OR_TEXT",
            "source_relative_path": "derived_from_renate_local_pdf",
            "local_path": row["local_ocr_path"],
            "bytes": path.stat().st_size,
            "sha256": row["ocr_sha256_observed"],
            "title": row["title"],
            "edition": row["edition"] or parent["edition"],
            "citation_status": "DERIVATIVE_TEXT_LOCAL",
            "redistribution_status": "USER_CONFIRMED_NO_LEGAL_RESTRICTION_2026-11-06",
            "copy_decision": "GENERATED_FROM_RENATE_LOCAL_PDF",
            "user_ocr_approval": "HUMAN_APPROVED_BY_USER_2026-11-06",
            "route_ids": [value for value in row["referenced_by"].split("; ") if value],
        })
        allowed_local_paths.add(row["local_ocr_path"])
    ALLOWLIST.write_text(json.dumps(allowlist, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    groups: dict[str, list[dict]] = defaultdict(list)
    for record in records:
        groups[normalized_question(record["question"])].append(record)
    cases = []
    conflicts = []
    for record in sorted(records, key=lambda r: r["atlas_id"]):
        key = normalized_question(record["question"])
        group = groups[key]
        answer_hashes = sorted({hashlib.sha256(r["answer"].encode("utf-8")).hexdigest() for r in group})
        conflicting = len(group) > 1 and len(answer_hashes) > 1
        expected_routes = set(record.get("route_ids", []))
        if alpha_routes.get(record["atlas_id"]):
            expected_routes.add(alpha_routes[record["atlas_id"]])
        case = {
            "case_id": f"ATLAS-{record['atlas_id']}",
            "atlas_id": record["atlas_id"],
            "question_sha256": hashlib.sha256(record["question"].encode("utf-8")).hexdigest(),
            "expected_answer_sha256": None if conflicting else hashlib.sha256(record["answer"].encode("utf-8")).hexdigest(),
            "expected_resolution": "ASK_FOR_CLARIFICATION" if conflicting else "MATCH_ATLAS_RECORD",
            "duplicate_group": hashlib.sha256(key.encode("utf-8")).hexdigest()[:16] if len(group) > 1 else None,
            "candidate_atlas_ids": sorted(r["atlas_id"] for r in group) if conflicting else [],
            "expected_route_ids": sorted(expected_routes),
            "expected_source_ids": record.get("source_ids", []),
            "expected_rule_locators": record.get("rule_locators", []),
            "atlas_response_status": record.get("atlas_response_status"),
            "human_approval_status": record.get("human_approval_status"),
        }
        cases.append(case)
    for key, group in sorted(groups.items()):
        hashes = sorted({hashlib.sha256(r["answer"].encode("utf-8")).hexdigest() for r in group})
        if len(group) > 1 and len(hashes) > 1:
            conflicts.append({
                "duplicate_group": hashlib.sha256(key.encode("utf-8")).hexdigest()[:16],
                "candidate_atlas_ids": sorted(r["atlas_id"] for r in group),
                "distinct_answer_sha256": hashes,
                "expected_resolution": "ASK_FOR_CLARIFICATION",
            })

    golden = {
        "schema_version": "renate.atlas-golden-reference.v1",
        "purpose": "test_only_reference_manifest; runtime reads ATLAS snapshot directly",
        "created_on": "2026-11-06",
        "source_snapshot": "data/imports/day1_2026-11-06/atlas/atlas_qa_route_candidates_2026-11-06.jsonl",
        "source_snapshot_sha256": sha256(ATLAS),
        "case_count": len(cases),
        "conflicting_duplicate_group_count": len(conflicts),
        "cases": cases,
        "conflicting_duplicate_groups": conflicts,
    }
    GOLDEN.write_text(json.dumps(golden, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({
        "renate_root": str(ROOT),
        "atlas_records": len(records),
        "manifest_rows": len(rows),
        "paired_orphan_documents": len(pair_audit),
        "golden_cases": len(cases),
        "conflicting_duplicate_groups": len(conflicts),
        "atlas_source_bindings": len(bindings),
        "unresolved_atlas_source_bindings": len(unresolved),
        "unresolved_source_binding_sample": unresolved[:25],
        "golden_path": str(GOLDEN.relative_to(ROOT)).replace("\\", "/"),
        "pdf_ocr_pairs": pair_audit,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
