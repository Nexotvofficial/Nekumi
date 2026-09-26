import requests
from bs4 import BeautifulSoup

res = requests.get("https://lector-mangas.lat/comics/colorista", headers={'User-Agent': 'Mozilla/5.0'})
soup = BeautifulSoup(res.text, 'html.parser')

print("META OG DESC:", soup.find('meta', property='og:description'))
print("META DESC:", soup.find('meta', attrs={'name': 'description'}))

print("\nGENRES:")
for a in soup.find_all('a', href=True):
    if 'genero' in a['href'].lower() or 'genre' in a['href'].lower() or 'category' in a['href'].lower():
        print(a.text.strip())
