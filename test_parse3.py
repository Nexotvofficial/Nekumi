import requests
from bs4 import BeautifulSoup
import re

res = requests.get("https://lector-mangas.lat/comics/colorista", headers={'User-Agent': 'Mozilla/5.0'})
soup = BeautifulSoup(res.text, 'html.parser')

for div in soup.find_all('div', class_=re.compile('summary|desc|excerpt')):
    if len(div.text.strip()) > 20:
        print(div.get('class'), "->", div.text.strip()[:100])
