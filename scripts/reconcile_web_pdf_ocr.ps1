$ErrorActionPreference = 'Stop'
$renate = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$sources = Join-Path $renate 'data\imports\day1_2026-11-06\sources'
$stage = Join-Path $sources 'web-staging'
$items = @(
  @{ id='ADANA-SRC-02E3760715D532DF'; staged='cbte_wrabf_specific_2024.pdf'; edition='Atualizado em 20/11/2024'; route='cbte.wrabf.rifle_international'; title='Carabina WRABF — Regulamento Específico CBTE, atualizado em 20/11/2024'; url='https://www.cbte.org.br/wp-content/uploads/WRABF-Regulamento-Especifico-Brasil-2025-20-11-2024-COMPLETO.pdf' },
  @{ id='ADANA-SRC-214E78376F9517D1'; staged='trap_nacional_25_2024.pdf'; edition='2024'; route='cbte.shotgun.trap_nacional_25_2024'; title='Regulamento Geral Trap Nacional 25 CBTE 2024'; url='https://www.cbte.org.br/wp-content/uploads/Regulamento-Geral-Trap-Nacional-25-29022024.pdf' },
  @{ id='ADANA-SRC-230B81C6286AE94E'; staged='fossa_automatica_2024.pdf'; edition='23/12/2024'; route='cbte.shotgun.automatic_trap'; title='Regulamento Geral de Fossa Automática'; url='https://www.cbte.org.br/wp-content/uploads/Regulamento-Geral-de-Fossa-Automatica-23122024.pdf' },
  @{ id='ADANA-SRC-277F6EDC18262298'; staged='trap_nacional_2026.pdf'; edition='2026'; route='cbte.shotgun.trap_nacional'; title='Regulamento Geral Trap Nacional 2026'; url='https://www.cbte.org.br/wp-content/uploads/Regulamento-Geral-2026-Trap-Atualizado-em-01012026-Publicado.pdf' },
  @{ id='ADANA-SRC-3243DF292DBCD06A'; staged='trap_nacional_50_2024.pdf'; edition='2024'; route='cbte.shotgun.trap_nacional_50_2024'; title='Regulamento Geral Trap Nacional 50 CBC/CBTE 2024'; url='https://www.cbte.org.br/wp-content/uploads/Regulamento-Geral-Trap-Nacional-50-29022024.pdf' },
  @{ id='ADANA-SRC-5AD016EBD99EEDAA'; staged='planejamento_car_pst_2026.pdf'; edition='CAR/PST 2026; atualizado em 10/12/2025'; route='cbte.shotgun.trap_nacional'; title='Planejamento Técnico CAR/PST 2026'; url='https://www.cbte.org.br/wp-content/uploads/Planejamento_Tecnico_2026_assinado.pdf' },
  @{ id='ADANA-SRC-7914789A181774E9'; staged='regulamento_cpr_2026.pdf'; edition='2026; atualizado em 30/12/2025'; route='cbte.cma.10m;cbte.cma.25m;cbte.cma.50m;cbte.cmp.rimfire_sporter;cbte.duelo.10m;cbte.duelo.25m;cbte.fclass.centerfire;cbte.shotgun.trap_nacional'; title='Regulamento Geral CPR 2026'; url='https://www.cbte.org.br/wp-content/uploads/Regulamento-Geral-2026-CPR-Atualizado-em-30122025-Publicacao-Revisada.pdf' },
  @{ id='ADANA-SRC-8F6C57074DE63477'; staged='wrabf_rules_2023_2027_v4_4.pdf'; edition='2023–2027; Version 4.4'; route='cbte.wrabf.rifle_international'; title='WRABF Rules 2023–2027 V4.4'; url='https://wrabf.com/documents/WRABF%20Rules%202023-2027%20V4.4.pdf' },
  @{ id='ADANA-SRC-AA64B7BC76972EE0'; staged='tiro_ao_prato_2025_2028_latest.pdf'; edition='2025/2028; revisado em 19/12/2024'; route='cbte.shotgun.issf;cbte.shotgun.trap_light'; title='Regulamento Geral de Tiro ao Prato 2025/2028'; url='https://www.cbte.org.br/wp-content/uploads/Regulamento-Geral-de-Tiro-ao-Prato-2025_2028-Corrigido-em-24062024.pdf' },
  @{ id='ADANA-SRC-C320971D06D9EC3E'; staged='fossa_automatica_2020.pdf'; edition='Criado em 19/11/2020'; route='cbte.shotgun.automatic_trap'; title='Regulamento de Fossa Automática'; url='https://www.cbte.org.br/wp-content/uploads/regulamento_prova_fossa_automatica.pdf' },
  @{ id='ADANA-SRC-E9D7DC1442865DD0'; staged='ata_rulebook_current.pdf'; edition='2027 target year; effective 01/09/2026'; route='cbte.shotgun.trap_nacional'; title='ATA Rulebook'; url='https://shootata.com/portals/0/pdf/Rulebook.pdf' }
)

$coveragePath = Join-Path $sources 'pdf_ocr_coverage_2026-11-06.csv'
$coverage = Import-Csv $coveragePath
$manifestPath = Join-Path $renate 'library\manifest.csv'
$manifest = Import-Csv $manifestPath
$audit = @()
$verify = @()

foreach ($item in $items) {
  $pdf = Get-ChildItem (Join-Path $renate ('library\documents\' + $item.id)) -Filter '*.pdf' | Select-Object -First 1
  $ocr = Get-ChildItem (Join-Path $renate ('library\ocr\' + $item.id)) -Filter '*.ocr.txt' | Select-Object -First 1
  $pdfRel = $pdf.FullName.Substring($renate.Length + 1).Replace('\', '/')
  $ocrRel = $ocr.FullName.Substring($renate.Length + 1).Replace('\', '/')
  $pdfHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $pdf.FullName).Hash.ToLower()
  $ocrHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $ocr.FullName).Hash.ToLower()
  $stagedPath = Join-Path $stage $item.staged
  $stagedHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $stagedPath).Hash.ToLower()
  if ($pdfHash -ne $stagedHash) { throw "Downloaded PDF hash mismatch: $($item.id)" }
  $text = Get-Content -LiteralPath $ocr.FullName -Raw -Encoding UTF8
  if ([string]::IsNullOrWhiteSpace($text)) { throw "OCR is empty: $($item.id)" }
  $row = $coverage | Where-Object source_id -eq $item.id
  if (-not $row) { throw "Coverage row missing: $($item.id)" }
  $row.ocr_status = 'OCR_GENERATED_FROM_HASH_VERIFIED_OFFICIAL_PDF'
  $row.linked_ocr_paths = $ocrRel
  $row.linked_ocr_sha256 = $ocrHash

  $audit += [pscustomobject]@{
    source_id=$item.id; title=$item.title; edition=$item.edition; source_url=$item.url
    downloaded_pdf_name=$item.staged; local_pdf_path=$pdfRel; downloaded_and_local_pdf_sha256=$pdfHash
    pdf_hash_match=$true; ocr_method='pdftotext -layout -enc UTF-8 (embedded text layer extraction)'
    local_ocr_path=$ocrRel; ocr_sha256=$ocrHash; characters=$text.Length
    pages=([regex]::Matches($text, "`f").Count + 1); referenced_by=$item.route
    human_ocr_approval='HUMAN_APPROVED_BY_USER_2026-11-06'
  }
  $verify += [pscustomobject]@{
    source_id=$item.id; pdf_sha256=$pdfHash; online_download_sha256=$stagedHash; ocr_sha256=$ocrHash
    pdf_match='PASS'; ocr_present=$true; ocr_method='pdftotext -layout -enc UTF-8'; verified_at='2026-11-06'
  }

  $derivedId = 'ADANA-DERIVED-' + $ocrHash.Substring(0, 16).ToUpper()
  if (-not ($manifest | Where-Object local_ocr_path -eq $ocrRel)) {
    $manifest += [pscustomobject]@{
      source_id=$derivedId; document_source_id=$item.id; artifact_kind='ocr'; title=$item.title
      local_pdf_path=$pdfRel; pdf_sha256_observed=$pdfHash; local_ocr_path=$ocrRel
      ocr_sha256_observed=$ocrHash; edition=$item.edition
      page_or_locator='Full document text; page delimiters retained; extracted from verified official PDF text layer'
      referenced_by=$item.route; license_status='USER_CONFIRMED_NO_LEGAL_RESTRICTION'
      collection_status='WEB_DOWNLOADED_HASH_VERIFIED'; record_type='DERIVED_OCR_LINKED_TO_PDF'
      citation_status='SOURCE_TEXT_LAYER_EXTRACTION'; human_ocr_approval='HUMAN_APPROVED_BY_USER_2026-11-06'
    }
  }
}

$coverage | Export-Csv -LiteralPath $coveragePath -NoTypeInformation -Encoding utf8
@() | Export-Csv -LiteralPath (Join-Path $sources 'pdf_ocr_coverage_gaps_2026-11-06.csv') -NoTypeInformation -Encoding utf8
$audit | Export-Csv -LiteralPath (Join-Path $sources 'web_pdf_ocr_collection_audit_2026-11-06.csv') -NoTypeInformation -Encoding utf8
$verify | Export-Csv -LiteralPath (Join-Path $sources 'web_pdf_ocr_hash_verification_2026-11-06.csv') -NoTypeInformation -Encoding utf8
$manifest | Export-Csv -LiteralPath $manifestPath -NoTypeInformation -Encoding utf8

$stageResolved = (Resolve-Path $stage).Path
$renatePrefix = $renate.TrimEnd('\') + '\'
if (-not $stageResolved.StartsWith($renatePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Refusing to remove staging outside RENATE.'
}
Remove-Item -LiteralPath $stageResolved -Recurse -Force

[pscustomobject]@{
  generated_ocr_count=$audit.Count
  downloaded_pdf_hash_matches=(@($audit | Where-Object pdf_hash_match).Count)
  nonempty_ocr_count=(@($verify | Where-Object ocr_present).Count)
  library_manifest_rows=$manifest.Count
  staging_directory_removed=$true
} | ConvertTo-Json
