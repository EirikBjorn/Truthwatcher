import * as cheerio from 'cheerio'

const browserProfiles = [
  {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    acceptLanguage: 'en-US,en;q=0.9',
  },
  {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    acceptLanguage: 'en-US,en;q=0.8',
  },
  {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:136.0) Gecko/20100101 Firefox/136.0',
    acceptLanguage: 'en-US,en;q=0.7',
  },
]

function pickBrowserProfile() {
  return browserProfiles[Math.floor(Math.random() * browserProfiles.length)]
}

export async function requestPage(url) {
  const browserProfile = pickBrowserProfile()
  const response = await fetch(url, {
    headers: {
      'user-agent': browserProfile.userAgent,
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'accept-language': browserProfile.acceptLanguage,
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      referer: 'https://www.google.com/',
      'upgrade-insecure-requests': '1',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  return cheerio.load(html)
}
