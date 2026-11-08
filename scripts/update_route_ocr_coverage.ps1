$ErrorActionPreference = 'Stop'
$renate = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$base = Join-Path $renate 'data\imports\day1_2026-11-06'
$coverage = Import-Csv (Join-Path $base 'sources\pdf_ocr_coverage_2026-11-06.csv')
$newOcrBySource = @{}
foreach ($item in $coverage) {
  if ($item.ocr_status -eq 'OCR_GENERATED_FROM_HASH_VERIFIED_OFFICIAL_PDF') {
    $newOcrBySource[$item.source_id] = $item.linked_ocr_paths
  }
}

foreach ($name in @('route_audit_62_2026-11-06.csv', 'route_governance_composite_63_2026-11-06.csv')) {
  $path = Join-Path $base ('governance\' + $name)
  $rows = Import-Csv $path
  foreach ($row in $rows) {
    $sources = @($row.source_ids -split ';' | Where-Object { $_ })
    $paths = @($row.local_ocr_paths -split ';' | Where-Object { $_ })
    foreach ($sourceId in $sources) {
      if ($newOcrBySource.ContainsKey($sourceId)) { $paths += $newOcrBySource[$sourceId] }
    }
    $paths = @($paths | Select-Object -Unique)
    $row.local_ocr_paths = $paths -join ';'
    $row.local_ocr_count = $paths.Count
  }
  $rows | Export-Csv -LiteralPath $path -NoTypeInformation -Encoding utf8
}

$jsonPath = Join-Path $base 'governance\route_audit_62_2026-11-06.json'
$jsonRows = Get-Content -LiteralPath $jsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($row in $jsonRows) {
  $sources = @($row.source_ids -split ';' | Where-Object { $_ })
  $paths = @($row.local_ocr_paths -split ';' | Where-Object { $_ })
  foreach ($sourceId in $sources) {
    if ($newOcrBySource.ContainsKey($sourceId)) { $paths += $newOcrBySource[$sourceId] }
  }
  $paths = @($paths | Select-Object -Unique)
  $row.local_ocr_paths = $paths -join ';'
  $row.local_ocr_count = $paths.Count
}
$jsonRows | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $jsonPath -Encoding utf8

$summaryPath = Join-Path $base 'governance\route_source_audit_summary_2026-11-06.json'
$summary = Get-Content -LiteralPath $summaryPath -Raw -Encoding UTF8 | ConvertFrom-Json
$summary | Add-Member -NotePropertyName current_ocr_text_count -NotePropertyValue 50 -Force
$summary | Add-Member -NotePropertyName current_library_manifest_record_count -NotePropertyValue 78 -Force
$summary | Add-Member -NotePropertyName web_downloaded_pdf_count -NotePropertyValue 11 -Force
$summary | Add-Member -NotePropertyName newly_generated_text_count -NotePropertyValue 11 -Force
$summary | Add-Member -NotePropertyName current_pdf_ocr_coverage -NotePropertyValue '28/28' -Force
$summary.pdfs_with_matching_ocr = 28
$summary.pdfs_without_matching_ocr = 0
$summary.ocr_gap_source_ids = @()
$summary | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $summaryPath -Encoding utf8

[pscustomobject]@{
  routes_csv=(Import-Csv (Join-Path $base 'governance\route_audit_62_2026-11-06.csv')).Count
  composite_rows=(Import-Csv (Join-Path $base 'governance\route_governance_composite_63_2026-11-06.csv')).Count
  json_routes=$jsonRows.Count
  pdfs_with_ocr=$summary.pdfs_with_matching_ocr
  pdfs_without_ocr=$summary.pdfs_without_matching_ocr
} | ConvertTo-Json
