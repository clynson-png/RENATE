"""Render controlled rule-table crops from RENATE's local PDF library only."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/imports/day1_2026-11-06/figure-crops"
OUT.mkdir(parents=True, exist_ok=True)

RIFLE_EVENTS = [f"issf.event.{number:02d}" for number in range(1, 7)] + [f"wsps.event.r{number}" for number in range(1, 12)] + ["wsps.event.vip", "wsps.event.vis"]
PISTOL_EVENTS = [f"issf.event.{number:02d}" for number in range(7, 13)] + [f"wsps.event.p{number}" for number in range(1, 7)]
CMA_10M_EVENTS = ["cbte.cma.10m"]
ISSF_MOVING_TARGET_EVENTS = ["issf.event.13", "issf.event.14"]
ISSF_SHOTGUN_EVENTS = [f"issf.event.{number:02d}" for number in range(15, 20)]
CBTE_SHOTGUN_EVENTS = ["cbte.shotgun.automatic_trap", "cbte.shotgun.trap_nacional", "cbte.shotgun.trap_nacional_25_2024", "cbte.shotgun.trap_nacional_50_2024", "cbte.shotgun.trap_light"]
CBTE_DUELO_EVENTS = ["cbte.duelo.10m", "cbte.duelo.25m"]

SPECS = [
    {
        "figure_id": "wsps-p4-events-table-p11",
        "event_ids": ["wsps.event.p4"],
        "document_source_id": "ADANA-SRC-892D95743F291E6F",
        "pdf_path": "library/documents/ADANA-SRC-892D95743F291E6F/WSPS Rulebook 2026_vFinal.pdf",
        "page": 11,
        "printed_page": 11,
        "locator": "2.1.1",
        "title": "WSPS Rulebook 2026 vFinal",
        "edition": "Vigente desde 01/01/2026",
        "crop_rect_points": [125, 228, 492, 692],
        "description": "Tabela de eventos WSPS, incluindo a linha P4 50m Pistol.",
    },
    {
        "figure_id": "wsps-p5-specifications-table-p34",
        "event_ids": ["wsps.event.p5"],
        "document_source_id": "ADANA-SRC-3B1650384F55C206",
        "pdf_path": "library/documents/ADANA-SRC-3B1650384F55C206/WSPS Rulebook Appendices 2026_vFinal.pdf",
        "page": 34,
        "printed_page": 34,
        "locator": "Appendix 6 §3",
        "title": "WSPS Rulebook Appendices 2026 vFinal",
        "edition": "Apêndices WSPS 2026 vFinal",
        "crop_rect_points": [35, 130, 542, 620],
        "description": "Tabela de especificações de equipamento e prova para P5.",
    },
    {
        "figure_id": "wsps-appendix5-sh2-support-spring-overview-p24",
        "event_ids": ["wsps.event.r4", "wsps.event.r5", "wsps.event.r9", "wsps.event.r11"],
        "show_when_keywords": ["mola", "spring", "garfo", "suporte de rifle", "support stand"],
        "document_source_id": "ADANA-SRC-3B1650384F55C206",
        "pdf_path": "library/documents/ADANA-SRC-3B1650384F55C206/WSPS Rulebook Appendices 2026_vFinal.pdf",
        "page": 24,
        "printed_page": 24,
        "locator": "Appendix 5 §1",
        "title": "WSPS Rulebook Appendices 2026 vFinal",
        "edition": "Apêndices WSPS 2026 vFinal",
        "crop_rect_points": [70, 235, 540, 710],
        "description": "Desenho oficial do suporte SH2, incluindo a mola e as partes superior e inferior.",
    },
    {
        "figure_id": "wsps-appendix5-spring-flexibility-p26",
        "event_ids": ["wsps.event.r4", "wsps.event.r5", "wsps.event.r9", "wsps.event.r11"],
        "show_when_keywords": ["mola", "spring", "flexibilidade", "garfo", "suporte de rifle", "support stand"],
        "document_source_id": "ADANA-SRC-3B1650384F55C206",
        "pdf_path": "library/documents/ADANA-SRC-3B1650384F55C206/WSPS Rulebook Appendices 2026_vFinal.pdf",
        "page": 26,
        "printed_page": 26,
        "locator": "Appendix 5 §3.2",
        "title": "WSPS Rulebook Appendices 2026 vFinal",
        "edition": "Apêndices WSPS 2026 vFinal",
        "crop_rect_points": [45, 235, 555, 590],
        "description": "Procedimento ilustrado para testar a flexibilidade das molas fraca (a) e forte (b), com pesos e medidas mínimos.",
    },
    {
        "figure_id": "wsps-appendix5-spring-test-bar-p27",
        "event_ids": ["wsps.event.r4", "wsps.event.r5", "wsps.event.r9", "wsps.event.r11"],
        "show_when_keywords": ["mola", "spring", "adesivo", "etiqueta vermelha", "garfo", "support stand"],
        "document_source_id": "ADANA-SRC-3B1650384F55C206",
        "pdf_path": "library/documents/ADANA-SRC-3B1650384F55C206/WSPS Rulebook Appendices 2026_vFinal.pdf",
        "page": 27,
        "printed_page": 27,
        "locator": "Appendix 5 §4",
        "title": "WSPS Rulebook Appendices 2026 vFinal",
        "edition": "Apêndices WSPS 2026 vFinal",
        "crop_rect_points": [45, 125, 555, 565],
        "description": "Ilustração da verificação da mola em quatro posições e da marca vermelha de reprovação.",
    },
    {
        "figure_id": "issf-rifle-measurements-p327", "event_ids": RIFLE_EVENTS,
        "show_when_keywords": ["carabina", "rifle", "dimensões", "medidas"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 327, "printed_page": 327, "locator": "7.4.4.1",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [90, 130, 490, 680], "description": "Diagrama de medidas das carabinas de ar e padrão, com dimensões identificadas.",
    },
    {
        "figure_id": "issf-shooting-shoes-p333", "event_ids": RIFLE_EVENTS,
        "show_when_keywords": ["calçado", "sapato", "sapatos", "bota", "botas", "shoe", "shoes"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 333, "printed_page": 333, "locator": "7.5.3.6",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [110, 310, 535, 650], "description": "Desenho e tabela das medidas permitidas para calçados de tiro.",
    },
    {
        "figure_id": "issf-shooting-jacket-p335", "event_ids": RIFLE_EVENTS,
        "show_when_keywords": ["casaco", "jaqueta", "jacket", "vestimenta", "roupa de tiro"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 335, "printed_page": 335, "locator": "7.5.4.9",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [85, 290, 520, 690], "description": "Desenhos e dimensões de casacos de tiro previstos pela regra ISSF.",
    },
    {
        "figure_id": "issf-shooting-trousers-p337", "event_ids": RIFLE_EVENTS,
        "show_when_keywords": ["calça", "calças", "calça de tiro", "trousers", "pants"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 337, "printed_page": 337, "locator": "7.5.5.5",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [75, 405, 520, 710], "description": "Diagrama das medidas de calças de tiro e posição das aberturas.",
    },
    {
        "figure_id": "issf-pistol-grips-p355", "event_ids": PISTOL_EVENTS,
        "show_when_keywords": ["punho", "empunhadura", "grip", "mola", "garfo"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 355, "printed_page": 355, "locator": "8.4.3",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [85, 90, 530, 710], "description": "Desenhos oficiais de punhos de pistola e das superfícies de empunhadura permitidas.",
    },
    {
        "figure_id": "issf-pistol-specifications-table-p375", "event_ids": PISTOL_EVENTS,
        "show_when_keywords": ["caixa de pistola", "caixa", "medida da pistola", "dimensão da pistola", "medição da pistola", "pistol box"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 375, "printed_page": 375, "locator": "8.12",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [85, 75, 520, 775], "description": "Tabela oficial de especificações e da caixa de medição das pistolas.",
    },
    {
        "figure_id": "cbte-cma-10m-attachments-p3", "event_ids": CMA_10M_EVENTS,
        "show_when_keywords": ["garfo", "compensador", "air stripper", "ponteira", "cocking lever", "mola pneumática"],
        "document_source_id": "ADANA-SRC-C7C829803AF1BB22",
        "pdf_path": "library/documents/ADANA-SRC-C7C829803AF1BB22/Regulamento-CMA-10m-03012025.pdf",
        "page": 3, "printed_page": 3, "locator": "II.d.2.3",
        "title": "Regulamento CBTE — Carabina Mira Aberta 10 m", "edition": "Atualizado em 03/01/2025",
        "crop_rect_points": [45, 420, 550, 620],
        "description": "Imagens de compensadores, air stripper e ponteira cocking lever; os rótulos indicam os itens permitidos ou vedados.",
    },
    {
        "figure_id": "cbte-cma-10m-sights-p4", "event_ids": CMA_10M_EVENTS,
        "show_when_keywords": ["alça", "mira", "retículo", "reticulos", "visada"],
        "document_source_id": "ADANA-SRC-C7C829803AF1BB22",
        "pdf_path": "library/documents/ADANA-SRC-C7C829803AF1BB22/Regulamento-CMA-10m-03012025.pdf",
        "page": 4, "printed_page": 4, "locator": "II.d.3.2",
        "title": "Regulamento CBTE — Carabina Mira Aberta 10 m", "edition": "Atualizado em 03/01/2025",
        "crop_rect_points": [75, 145, 525, 385],
        "description": "Diagramas de retículos e miras permitidos e não permitidos.",
    },
]

# Additional illustrations found in the current, already-local RENATE PDFs.
# These are mapped to the question topics that they actually illustrate.
SPECS.extend([
    {
        "figure_id": "cbte-cma-25m-three-target-layout-p2", "event_ids": ["cbte.cma.25m"],
        "show_when_keywords": ["alvo", "centro do alvo", "centros do alvo", "target"],
        "document_source_id": "ADANA-SRC-BB8F58B6923B11B0",
        "pdf_path": "library/documents/ADANA-SRC-BB8F58B6923B11B0/Regulamento-CMA-25m-02012025.pdf",
        "page": 2, "printed_page": 2, "locator": "II.b",
        "title": "Regulamento CBTE — Carabina Mira Aberta 25 m", "edition": "Atualizado em 02/01/2025",
        "crop_rect_points": [15, 215, 290, 410],
        "description": "Disposição dos três centros do alvo de pistola de precisão, com o centro olímpico em branco.",
    },
    {
        "figure_id": "cbte-duelo-25m-pistol-grip-examples-p4", "event_ids": CBTE_DUELO_EVENTS,
        "show_when_keywords": ["empunhadura", "tela anatômica", "tala anatômica", "cutelo", "beaver tail", "punho"],
        "document_source_id": "ADANA-SRC-0BA1DB11F0F5A45C",
        "pdf_path": "library/documents/ADANA-SRC-0BA1DB11F0F5A45C/Regulamento-Duelo-20s-02012025.pdf",
        "page": 4, "printed_page": 4, "locator": "Equipamentos — empunhaduras",
        "title": "Regulamento CBTE — Duelo 20 segundos", "edition": "Atualizado em 02/01/2025",
        "crop_rect_points": [25, 75, 550, 600],
        "description": "Exemplos oficiais de talas anatômicas permitidas e vedadas e de apoio do cutelo/beaver tail.",
    },
    {
        "figure_id": "cbte-duelo-10m-pistol-grip-examples-p6", "event_ids": ["cbte.duelo.10m"],
        "show_when_keywords": ["empunhadura", "tela anatômica", "tala anatômica", "cutelo", "beaver tail", "punho"],
        "document_source_id": "ADANA-SRC-13851AFE541DA476",
        "pdf_path": "library/documents/ADANA-SRC-13851AFE541DA476/Regulamento-Duelo-20s-10m-07012025.pdf",
        "page": 6, "printed_page": 6, "locator": "Equipamentos — empunhaduras",
        "title": "Regulamento CBTE — Duelo 20 segundos 10 m", "edition": "Atualizado em 07/01/2025",
        "crop_rect_points": [55, 375, 515, 770],
        "description": "Exemplos oficiais de talas anatômicas permitidas e vedadas e de apoio do cutelo/beaver tail.",
    },
    {
        "figure_id": "cbte-duelo-25m-rapid-target-p2", "event_ids": ["cbte.duelo.25m"],
        "show_when_keywords": ["alvo", "target", "tiro rápido"],
        "document_source_id": "ADANA-SRC-0BA1DB11F0F5A45C",
        "pdf_path": "library/documents/ADANA-SRC-0BA1DB11F0F5A45C/Regulamento-Duelo-20s-02012025.pdf",
        "page": 2, "printed_page": 2, "locator": "II.b",
        "title": "Regulamento CBTE — Duelo 20 segundos", "edition": "Atualizado em 02/01/2025",
        "crop_rect_points": [20, 150, 355, 450],
        "description": "Alvo de Tiro Rápido com centro branco/obreia branca usado no Duelo 20 segundos 25 m.",
    },
    {
        "figure_id": "cbte-duelo-10m-precision-target-p2", "event_ids": ["cbte.duelo.10m"],
        "show_when_keywords": ["alvo", "target", "pistola de precisão"],
        "document_source_id": "ADANA-SRC-13851AFE541DA476",
        "pdf_path": "library/documents/ADANA-SRC-13851AFE541DA476/Regulamento-Duelo-20s-10m-07012025.pdf",
        "page": 2, "printed_page": 2, "locator": "II.b",
        "title": "Regulamento CBTE — Duelo 20 segundos 10 m", "edition": "Atualizado em 07/01/2025",
        "crop_rect_points": [70, 365, 300, 625],
        "description": "Alvo de pistola de precisão ilustrado no regulamento CBTE de Duelo 20 segundos 10 m.",
    },
    {
        "figure_id": "issf-target-300m-rifle-p195", "event_ids": ["issf.event.04", "issf.event.05", "issf.event.06"],
        "show_when_keywords": ["300m", "300 m", "300 metros"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 195, "printed_page": 195, "locator": "6.3.4.1",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [90, 300, 520, 750], "description": "Alvo e tabela dimensional da carabina 300 m.",
    },
    {
        "figure_id": "issf-target-50m-rifle-p196", "event_ids": ["issf.event.02", "issf.event.03"],
        "show_when_keywords": ["50m", "50 m", "50 metros"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 196, "printed_page": 196, "locator": "6.3.4.2",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [80, 90, 460, 630], "description": "Alvo e tabela dimensional da carabina 50 m.",
    },
    {
        "figure_id": "issf-target-10m-air-rifle-p197", "event_ids": ["issf.event.01"],
        "show_when_keywords": ["10m", "10 m", "10 metros", "carabina de ar", "air rifle"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 197, "printed_page": 197, "locator": "6.3.4.3",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [80, 80, 430, 570], "description": "Alvo e tabela dimensional da carabina de ar 10 m.",
    },
    {
        "figure_id": "issf-target-25m-rapid-pistol-p198", "event_ids": PISTOL_EVENTS,
        "show_when_keywords": ["tiro rápido", "rapid-fire", "rapid fire", "pistola rápida"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 198, "printed_page": 198, "locator": "6.3.4.4",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [80, 80, 525, 655], "description": "Alvo de pistola de tiro rápido 25 m e medidas dos anéis.",
    },
    {
        "figure_id": "issf-target-25m-precision-pistol-p199", "event_ids": PISTOL_EVENTS + ["cbte.cma.50m"],
        "show_when_keywords": ["25m", "25 m", "25 metros", "precisão", "precision", "50m", "50 m"],
        "exclude_when_keywords": ["tiro rápido", "rapid-fire", "rapid fire"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 199, "printed_page": 199, "locator": "6.3.4.5",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [80, 80, 525, 680], "description": "Alvo de pistola de precisão 25 m e 50 m e medidas dos anéis.",
    },
    {
        "figure_id": "issf-target-10m-air-pistol-p200", "event_ids": PISTOL_EVENTS + ["cbte.cma.10m"],
        "show_when_keywords": ["10m", "10 m", "10 metros", "pistola de ar", "air pistol"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 200, "printed_page": 200, "locator": "6.3.4.6",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [80, 80, 555, 740], "description": "Alvo e tabela dimensional da pistola de ar 10 m.",
    },
    {
        "figure_id": "issf-target-50m-moving-target-p201", "event_ids": ISSF_MOVING_TARGET_EVENTS,
        "show_when_keywords": ["alvo móvel", "moving target", "50m", "50 m"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 201, "printed_page": 201, "locator": "6.3.4.7",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [90, 330, 555, 650], "description": "Alvo móvel 50 m, com zonas e anéis em ambos os lados.",
    },
    {
        "figure_id": "issf-target-10m-moving-target-p203", "event_ids": ISSF_MOVING_TARGET_EVENTS,
        "show_when_keywords": ["alvo móvel", "moving target", "10m", "10 m"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 203, "printed_page": 203, "locator": "6.3.4.8",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [110, 55, 560, 520], "description": "Versões em papel e eletrônica do alvo móvel 10 m.",
    },
    {
        "figure_id": "issf-clay-target-p206", "event_ids": ISSF_SHOTGUN_EVENTS + CBTE_SHOTGUN_EVENTS,
        "show_when_keywords": ["prato", "pratos", "clay target", "alvo de argila", "fossa", "trap", "skeet"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 206, "printed_page": 206, "locator": "6.3.6",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [75, 90, 540, 570], "description": "Desenho e especificações dimensionais do prato de argila ISSF.",
    },
    {
        "figure_id": "issf-clothing-stiffness-measurement-device-p228", "event_ids": RIFLE_EVENTS,
        "show_when_keywords": ["rigidez", "rígida", "rigida", "medição da roupa", "dispositivo de medição", "controle de equipamento"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 228, "printed_page": 228, "locator": "6.5.2",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [70, 75, 525, 665], "description": "Desenho e peças do dispositivo de medição da rigidez da vestimenta.",
    },
    {
        "figure_id": "issf-shoe-sole-flexibility-device-p229", "event_ids": RIFLE_EVENTS,
        "show_when_keywords": ["flexibilidade da sola", "sola do calçado", "flexibilidade do calçado", "shoe sole"],
        "document_source_id": "ADANA-SRC-2A79B10E08375DE1",
        "pdf_path": "library/documents/ADANA-SRC-2A79B10E08375DE1/ISSF-Rule-Book-2026-Edition-2025-Third-Print-10-2026-Effective-19-October-2026.pdf",
        "page": 229, "printed_page": 229, "locator": "6.5.3",
        "title": "ISSF Rule Book 2026 — Third Print 10/2026", "edition": "Terceira impressão; vigente desde 19/10/2026",
        "crop_rect_points": [85, 75, 555, 410], "description": "Dispositivo oficial para verificar a flexibilidade da sola do calçado de tiro.",
    },
    {
        "figure_id": "wsps-appendix4-trigger-extension-examples-p22", "event_ids": RIFLE_EVENTS + PISTOL_EVENTS + [f"wsps.event.{kind}{n}" for kind in ("r", "p") for n in range(1, 7)],
        "show_when_keywords": ["gatilho", "trigger", "extensão do gatilho", "adaptação do gatilho"],
        "document_source_id": "ADANA-SRC-3B1650384F55C206",
        "pdf_path": "library/documents/ADANA-SRC-3B1650384F55C206/WSPS Rulebook Appendices 2026_vFinal.pdf",
        "page": 22, "printed_page": 22, "locator": "Appendix 4",
        "title": "WSPS Rulebook Appendices 2026 vFinal", "edition": "Apêndices WSPS 2026 vFinal",
        "crop_rect_points": [40, 150, 565, 700], "description": "Exemplos fotográficos de extensão de gatilho e adaptação dentro/fora dos limites ISSF.",
    },
    {
        "figure_id": "wsps-appendix4-trigger-adaptation-examples-p23", "event_ids": RIFLE_EVENTS + PISTOL_EVENTS + [f"wsps.event.{kind}{n}" for kind in ("r", "p") for n in range(1, 7)],
        "show_when_keywords": ["gatilho", "trigger", "extensão do gatilho", "adaptação do gatilho"],
        "document_source_id": "ADANA-SRC-3B1650384F55C206",
        "pdf_path": "library/documents/ADANA-SRC-3B1650384F55C206/WSPS Rulebook Appendices 2026_vFinal.pdf",
        "page": 23, "printed_page": 23, "locator": "Appendix 4",
        "title": "WSPS Rulebook Appendices 2026 vFinal", "edition": "Apêndices WSPS 2026 vFinal",
        "crop_rect_points": [40, 145, 565, 640], "description": "Exemplos fotográficos de adaptações de gatilho, incluindo configuração sem guarda.",
    },
    {
        "figure_id": "wsps-appendix5-sh2-upper-support-dimensions-p25", "event_ids": [f"wsps.event.r{number}" for number in range(1, 12)],
        "show_when_keywords": ["parte superior do suporte", "peso máximo do suporte", "dimensões do suporte", "200 g", "200 gramas"],
        "document_source_id": "ADANA-SRC-3B1650384F55C206",
        "pdf_path": "library/documents/ADANA-SRC-3B1650384F55C206/WSPS Rulebook Appendices 2026_vFinal.pdf",
        "page": 25, "printed_page": 25, "locator": "Appendix 5 §2",
        "title": "WSPS Rulebook Appendices 2026 vFinal", "edition": "Apêndices WSPS 2026 vFinal",
        "crop_rect_points": [80, 190, 490, 590], "description": "Desenho cotado da parte superior do suporte SH2 e seu peso máximo.",
    },
    {
        "figure_id": "wsps-appendix5-sh2-rifle-yoke-configuration-p28", "event_ids": [f"wsps.event.r{number}" for number in range(1, 12)],
        "show_when_keywords": ["yoke", "garfo", "eixo do cano", "configuração do rifle", "for-end"],
        "document_source_id": "ADANA-SRC-3B1650384F55C206",
        "pdf_path": "library/documents/ADANA-SRC-3B1650384F55C206/WSPS Rulebook Appendices 2026_vFinal.pdf",
        "page": 28, "printed_page": 28, "locator": "Appendix 5 §5",
        "title": "WSPS Rulebook Appendices 2026 vFinal", "edition": "Apêndices WSPS 2026 vFinal",
        "crop_rect_points": [75, 175, 525, 670], "description": "Configurações corretas e vedadas do rifle, for-end, yoke e mola SH2.",
    },
])

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

entries = []
for spec in SPECS:
    pdf_path = ROOT / spec["pdf_path"]
    if not pdf_path.is_file():
        raise FileNotFoundError(f"PDF local de RENATE ausente: {spec['pdf_path']}")
    pdf = pymupdf.open(pdf_path)
    page_index = spec["page"] - 1
    if page_index < 0 or page_index >= pdf.page_count:
        raise ValueError(f"Página {spec['page']} fora do PDF {spec['pdf_path']}")
    page = pdf[page_index]
    rect = pymupdf.Rect(spec["crop_rect_points"])
    if not page.rect.contains(rect):
        raise ValueError(f"Recorte fora dos limites da página: {spec['figure_id']}")
    output_path = OUT / f"{spec['figure_id']}.png"
    page.get_pixmap(matrix=pymupdf.Matrix(2.2, 2.2), clip=rect, alpha=False).save(output_path)
    entries.append({
        **spec,
        "pdf_sha256": digest(pdf_path),
        "asset_source_path": output_path.relative_to(ROOT).as_posix(),
        "asset_sha256": digest(output_path),
        "asset_bytes": output_path.stat().st_size,
        "render_scale": 2.2,
        "human_visual_review": "VISUALLY_CHECKED_CROP_CONTAINS_CITED_FIGURE_AND_LABELS",
    })

manifest = {
    "schema": "RENATE_RULE_PAGE_CROPS_V1",
    "source_boundary": "RENATE/library PDFs only",
    "generator": "scripts/render_rule_page_crops.py + PyMuPDF",
    "entries": entries,
}
(OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"state": "GENERATED_VISUALLY_REVIEWED", "count": len(entries), "entries": entries}, ensure_ascii=False, indent=2))
