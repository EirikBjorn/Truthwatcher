import * as cheerio from 'cheerio'

export async function requestPage(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'TruthwatcherBot/1.0 (+https://example.com)',
      accept: 'text/html,application/xhtml+xml',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  return cheerio.load(html)
}
