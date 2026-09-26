from playwright.sync_api import sync_playwright

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://manhwaweb.com/manhwa/que-abundante-cosecha-seor-demonio_1743103875540", wait_until="networkidle")
        
        print("TITLE:", page.title())
        html = page.content()
        with open("manhwaweb_dump.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("Guardado en manhwaweb_dump.html")
        browser.close()

if __name__ == "__main__":
    test()
