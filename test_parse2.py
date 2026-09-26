import requests
from bs4 import BeautifulSoup

res = requests.get("https://lector-mangas.lat/comics/colorista", headers={'User-Agent': 'Mozilla/5.0'})
soup = BeautifulSoup(res.text, 'html.parser')

summary = soup.find('div', class_='summary__content')
if summary:
    print("SUMMARY CONTENT:", summary.text.strip())
else:
    for p in soup.find_all('p'):
        if len(p.text) > 50:
            print("P:", p.text.strip())
            break
