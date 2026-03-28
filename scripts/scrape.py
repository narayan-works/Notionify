#!/usr/bin/env python3
"""
Crawl4AI scraping helper for Notionify.
Usage: python3 scripts/scrape.py <url>
Outputs: scraped markdown content to stdout
"""
import sys
import asyncio

async def scrape_url(url):
    try:
        from crawl4ai import AsyncWebCrawler
        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(url=url)
            if result.success:
                print(result.markdown)
            else:
                print(f"ERROR: Failed to scrape {url}", file=sys.stderr)
                sys.exit(1)
    except ImportError:
        # Fallback: simple fetch with urllib
        import urllib.request
        from html.parser import HTMLParser

        class TextExtractor(HTMLParser):
            def __init__(self):
                super().__init__()
                self.text = []
                self.skip = False
            def handle_starttag(self, tag, attrs):
                if tag in ('script', 'style', 'nav', 'footer', 'header'):
                    self.skip = True
            def handle_endtag(self, tag):
                if tag in ('script', 'style', 'nav', 'footer', 'header'):
                    self.skip = False
            def handle_data(self, data):
                if not self.skip:
                    text = data.strip()
                    if text:
                        self.text.append(text)

        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
        
        parser = TextExtractor()
        parser.feed(html)
        print('\n'.join(parser.text))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 scrape.py <url>", file=sys.stderr)
        sys.exit(1)
    asyncio.run(scrape_url(sys.argv[1]))
