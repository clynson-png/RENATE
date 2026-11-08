#!/usr/bin/env python3
"""Read-only static audit of the RENATE Day 1 export package."""

from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPORT = ROOT / "data/imports/day1_2026-11-06"


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def main() -> None:
    errors: list[str] = []
    with (ROOT / "library/manifest.csv").open(encoding="utf-8-sig", newline="") as stream:
        manifest = list(csv.DictReader(stream))
    kinds: dict[str, int] = {}
    pdf_by_document = {
        row["document_source_id"]: row
        for row in manifest
        if row["artifact_kind"] == "documents"
    }
    ocr_document_ids = {row["document_source_id"] for row in manifest if row["artifact_kind"] == "ocr"}
    docs_without_ocr = sorted(set(pdf_by_document) - ocr_document_ids)
    if docs_without_ocr:
        errors.append(f"PDFs without a linked OCR: {len(docs_without_ocr)}")
    for row in manifest:
        kind = row["artifact_kind"]
        kinds[kind] = kinds.get(kind, 0) + 1
        field = "local_pdf_path" if kind == "documents" else "local_ocr_path"
        expected_field = "pdf_sha256_observed" if kind == "documents" else "ocr_sha256_observed"
        local = row.get(field, "")
        path = ROOT / local
        if not local or not path.is_file() or not path.resolve().is_relative_to(ROOT.resolve()):
            errors.append(f"manifest file missing: {row.get('source_id')} {local}")
        elif digest(path) != row.get(expected_field):
            errors.append(f"manifest hash mismatch: {local}")
        if not row.get("license_status"):
            errors.append(f"manifest license status missing: {local}")
        if kind == "ocr" and not row.get("human_ocr_approval"):
            errors.append(f"manifest OCR approval missing: {local}")
        if kind == "ocr":
            parent = pdf_by_document.get(row.get("document_source_id", ""))
            if parent is None:
                errors.append(f"OCR not linked to a document row: {row.get('document_source_id')}")
                continue
            pdf_path = ROOT / parent.get("local_pdf_path", "")
            if not parent.get("pdf_sha256_observed") or not pdf_path.is_file():
                errors.append(f"OCR not linked to local PDF: {row.get('document_source_id')}")
            elif digest(pdf_path) != parent["pdf_sha256_observed"]:
                errors.append(f"OCR PDF hash mismatch: {row.get('document_source_id')}")

    allowlist_path = IMPORT / "sources/source_metadata_allowlist.json"
    allowlist = json.loads(allowlist_path.read_text(encoding="utf-8"))
    allowlist_items = allowlist.get("documents", [])
    allowlist_paths = {item.get("local_path", "") for item in allowlist_items}
    manifest_local_paths = {
        row.get("local_pdf_path", "") if row["artifact_kind"] == "documents" else row.get("local_ocr_path", "")
        for row in manifest
    }
    manifest_paths_without_allowlist = sorted(manifest_local_paths - allowlist_paths)
    allowlist_paths_without_manifest = sorted(allowlist_paths - manifest_local_paths)
    if manifest_paths_without_allowlist:
        errors.append(f"Manifest files missing from allowlist: {len(manifest_paths_without_allowlist)}")
    for item in allowlist_items:
        local = item.get("local_path", "")
        path = ROOT / local
        if not local or not path.is_file() or not path.resolve().is_relative_to(ROOT.resolve()):
            errors.append(f"allowlist local file missing: {item.get('source_id')} {local}")
        elif digest(path) != item.get("sha256"):
            errors.append(f"allowlist hash mismatch: {local}")
        if not item.get("redistribution_status"):
            errors.append(f"allowlist redistribution status missing: {local}")
        if item.get("format") == "PDF" and not item.get("edition"):
            errors.append(f"allowlist PDF edition missing: {local}")
    missing_editions = sorted({
        item.get("source_id", "")
        for item in allowlist_items
        if item.get("format") == "PDF" and not item.get("edition")
    })
    if missing_editions:
        errors.append(f"PDF edition fields missing: {len(missing_editions)}")
    unapproved_ocr_allowlist = sorted({
        item.get("local_path", "")
        for item in allowlist_items
        if item.get("format") == "OCR_OR_TEXT" and not item.get("user_ocr_approval")
    })
    if unapproved_ocr_allowlist:
        errors.append(f"OCR allowlist records missing human approval: {len(unapproved_ocr_allowlist)}")

    atlas_path = IMPORT / "atlas/atlas_qa_route_candidates_2026-11-06.jsonl"
    atlas = [json.loads(line) for line in atlas_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    atlas_ids = [r["atlas_id"] for r in atlas]
    if len(atlas) != 960 or len(set(atlas_ids)) != len(atlas_ids):
        errors.append(f"ATLAS count/ID uniqueness failed: {len(atlas)}")
    for record in atlas:
        if not record.get("question") or not record.get("answer") or record.get("renate_approved_as_evidence") is not True:
            errors.append(f"ATLAS required fields/approval missing: {record.get('atlas_id')}")

    golden = json.loads((IMPORT / "pretests/atlas_golden_set_manifest_2026-11-06.json").read_text(encoding="utf-8"))
    if golden.get("case_count") != len(atlas) or [c["atlas_id"] for c in golden.get("cases", [])] != sorted(atlas_ids):
        errors.append("Golden Set cases do not match the ATLAS snapshot")
    if golden.get("source_snapshot_sha256") != digest(atlas_path):
        errors.append("Golden Set source snapshot hash mismatch")
    alpha_path = IMPORT / "atlas/alphaomega_question_association_2026-11-06.jsonl"
    alpha_records = [json.loads(line) for line in alpha_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    golden_by_id = {case["atlas_id"]: case for case in golden.get("cases", [])}
    alpha_route_mismatches = [
        record["atlas_id"] for record in alpha_records
        if "renate.alphaomega" not in golden_by_id.get(record["atlas_id"], {}).get("expected_route_ids", [])
    ]
    if alpha_route_mismatches:
        errors.append(f"ALPHAOMEGA Golden Set route mismatch: {len(alpha_route_mismatches)}")
    binding_path = IMPORT / "atlas/atlas_source_bindings_2026-11-06.jsonl"
    bindings = [json.loads(line) for line in binding_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    unresolved_bindings = [item for item in bindings if item.get("status") != "RESOLVED_TO_RENATE_LIBRARY"]
    for binding in bindings:
        local = binding.get("renate_pdf_path")
        if local and (not (ROOT / local).is_file() or not (ROOT / local).resolve().is_relative_to(ROOT.resolve())):
            errors.append(f"ATLAS source binding points to missing file: {local}")
    if unresolved_bindings:
        errors.append(f"Unresolved ATLAS source bindings: {len(unresolved_bindings)}")
    bound_documents = {item.get("document_source_id") for item in bindings if item.get("status") == "RESOLVED_TO_RENATE_LIBRARY"}
    unused_documents = sorted(
        document_id for document_id, row in pdf_by_document.items()
        if document_id not in bound_documents and not row.get("referenced_by", "").strip()
    )
    if unused_documents:
        errors.append(f"PDFs not referenced by ATLAS source bindings: {len(unused_documents)}")

    route_audit = json.loads((IMPORT / "governance/route_audit_62_2026-11-06.json").read_text(encoding="utf-8"))
    if not isinstance(route_audit, list) or len(route_audit) != 62:
        errors.append("Route audit must preserve 62 route identities")
    pretest_candidates = json.loads((IMPORT / "chatbot-candidates/pretest_responses_candidate.json").read_text(encoding="utf-8"))
    if pretest_candidates.get("state") != "CANDIDATE_ONLY_NOT_RUNTIME_APPROVED":
        errors.append("Candidate pretest responses are not marked as excluded from runtime")
    rollup_counts = {}
    for route in ("p4", "p5"):
        rollup = json.loads((IMPORT / f"pretests/rollup_{route}_recorded.json").read_text(encoding="utf-8"))
        passes = rollup.get("pass_count", rollup.get("counts", {}).get("PASS", 0))
        total = rollup.get("case_count", rollup.get("focused_case_count", 0))
        rollup_counts[route.upper()] = {"pass": passes, "total": total}
        if passes != 12 or total != 12:
            errors.append(f"Recorded {route.upper()} pretest rollup is not 12/12 PASS")

    json_count = jsonl_count = 0
    for path in ROOT.rglob("*.json"):
        try:
            json.loads(path.read_text(encoding="utf-8"))
            json_count += 1
        except Exception as exc:
            errors.append(f"invalid JSON {path.relative_to(ROOT)}: {exc}")
    for path in ROOT.rglob("*.jsonl"):
        try:
            for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                if line.strip():
                    json.loads(line)
            jsonl_count += 1
        except Exception as exc:
            errors.append(f"invalid JSONL {path.relative_to(ROOT)}: {exc}")

    cards = json.loads((IMPORT / "cards/cards_allowlist_p4_p5.json").read_text(encoding="utf-8"))
    asset_checks = 0
    asset_dir = IMPORT / "cards/assets"
    asset_hashes: dict[str, set[str]] = {}

    def collect_assets(value: object) -> None:
        nonlocal asset_checks
        if isinstance(value, dict):
            for field, path_value in value.items():
                if field == "legacy_visual_asset_preserved":
                    continue
                if field in ("image", "background_image") and isinstance(path_value, str):
                    asset = asset_dir / Path(path_value).name
                    if asset.is_file():
                        asset_checks += 1
                        expected = value.get("asset_sha256") if field == "image" else value.get("background_image_sha256")
                        if expected:
                            asset_hashes.setdefault(asset.name, set()).add(expected)
                    elif path_value.lower().endswith((".png", ".svg", ".jpg", ".webp")):
                        errors.append(f"card asset missing: {path_value}")
                collect_assets(path_value)
        elif isinstance(value, list):
            for child in value:
                collect_assets(child)

    collect_assets(cards)
    for name, expected_values in asset_hashes.items():
        path = asset_dir / name
        observed = digest(path)
        if observed not in expected_values:
            errors.append(f"card asset hash mismatch: {name}")

    result = {
        "result": "PASS" if not errors else "FAIL",
        "scope": "RENATE-only static package audit; no application runtime test",
        "library_manifest_rows": len(manifest),
        "library_artifact_counts": kinds,
        "pdf_documents_without_ocr": docs_without_ocr,
        "pdf_documents_not_used_by_atlas": unused_documents,
        "allowlist_artifacts": len(allowlist_items),
        "manifest_paths_without_allowlist": manifest_paths_without_allowlist,
        "allowlist_paths_without_manifest": allowlist_paths_without_manifest,
        "allowlist_pdf_records_missing_edition": len(missing_editions),
        "missing_edition_source_ids": missing_editions,
        "ocr_allowlist_records_missing_human_approval": len(unapproved_ocr_allowlist),
        "unapproved_ocr_paths": unapproved_ocr_allowlist,
        "atlas_records": len(atlas),
        "golden_test_cases": golden.get("case_count"),
        "golden_conflicting_duplicate_groups": golden.get("conflicting_duplicate_group_count"),
        "alphaomega_records": len(alpha_records),
        "alphaomega_golden_route_mismatches": alpha_route_mismatches,
        "atlas_source_bindings": len(bindings),
        "unresolved_atlas_source_bindings": len(unresolved_bindings),
        "route_audit_records": len(route_audit) if isinstance(route_audit, list) else None,
        "recorded_pretest_rollups": rollup_counts,
        "candidate_pretest_response_records": pretest_candidates.get("count"),
        "candidate_pretest_state": pretest_candidates.get("state"),
        "valid_json_files": json_count,
        "valid_jsonl_files": jsonl_count,
        "card_asset_references_checked": asset_checks,
        "unique_card_assets_checked": len(asset_hashes),
        "errors": errors,
    }
    output = IMPORT / "pretests/day1_static_package_audit_2026-11-06.json"
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
