#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 NEKUMI — MODO MASIVO AUTOMÁTICO (SINCRONIZADOR DE CATÁLOGO COMPLETO) 🚀
Ejecuta: python mass_scraper.py
"""

from direct_scraper import auto_discover_and_import

if __name__ == "__main__":
    print("=" * 68)
    print("🚀 NEKUMI — MODO MASIVO AUTOMÁTICO DE MANHWAS Y CAPÍTULOS 🚀")
    print("=" * 68)
    pages_in = input("📄 ¿Cuántas páginas del catálogo quieres sincronizar? [Enter = 5 páginas (~75 manhwas)]: ").strip()
    num_pages = int(pages_in) if pages_in.isdigit() and int(pages_in) > 0 else 5
    auto_discover_and_import(pages_to_scan=num_pages)
