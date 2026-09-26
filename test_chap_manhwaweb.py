from playwright.sync_api import sync_playwright

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # I need a valid chapter URL for manhwaweb. Let's find one first.
        page.goto("https://manhwaweb.com/manhwa/que-abundante-cosecha-seor-demonio_1743103875540", wait_until="networkidle")
        html = page.content()
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')
        links = soup.find_all('a', href=True)
        for link in links:
            if '/leer/' in link['href'] or '/capitulo' in link['href'] or '/chapter' in link['href']:
                print("Found chapter link:", link['href'])
                page.goto("https://manhwaweb.com" + link['href'] if link['href'].startswith('/') else link['href'], wait_until="networkidle")
                chap_html = page.content()
                chap_soup = BeautifulSoup(chap_html, 'html.parser')
                imgs = chap_soup.find_all('img')
                for img in imgs:
                    print(" IMG:", img.get('src') or img.get('data-src'))
                break
        browser.close()

if __name__ == "__main__":
    test()
