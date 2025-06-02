import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import * as cheerio from 'cheerio'

// Utility to robustly parse AI-generated JSON that may be wrapped in markdown
// fences (``` or ```json) or have stray leading/trailing characters.
const safeJsonParse = <T = any>(raw: string): T => {
  const trimmed = raw
    .trim()
    // remove leading markdown code fences
    .replace(/^```[a-z]*\s*\n?/i, '')
    // remove trailing markdown code fences
    .replace(/```\s*$/i, '')
    .replace(/^[+\n]+/, '') // strip leading '+' or newlines that models sometimes add

  try {
    return JSON.parse(trimmed)
  } catch (_) {
    const first = trimmed.indexOf('{')
    const last = trimmed.lastIndexOf('}')
    if (first !== -1 && last !== -1 && last > first) {
      return JSON.parse(trimmed.slice(first, last + 1))
    }
    throw new Error('Failed to parse JSON from model response')
  }
}

// Fetch newest jobs from Indeed Japan for a given query string
async function scrapeIndeed(query: string) {
  const searchURL = `https://jp.indeed.com/jobs?q=${encodeURIComponent(
    query
  )}&fromage=1&sort=date`
  const results: any[] = []
  try {
    const html = await fetch(searchURL, {
      // Identify as a normal browser to avoid bot blocking
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Linked/1.0)' },
      // Disable following redirects for simplicity
      redirect: 'follow',
      // 10s timeout
    }).then((r) => r.text())

    const $ = cheerio.load(html)
    $('a.tapItem').each((_: unknown, el: cheerio.Element) => {
      const title = $(el).find('h2 span').text().trim()
      const company = $(el).find('.companyName').text().trim()
      const location = $(el).find('.companyLocation').text().trim()
      const summary = $(el).find('.job-snippet').text().trim()
      const url = 'https://jp.indeed.com' + ($(el).attr('href') || '')
      if (title) {
        results.push({
          source: 'indeed',
          title,
          company,
          location,
          summary,
          url,
        })
      }
    })
  } catch (err) {
    console.error('Failed to scrape Indeed:', err)
  }
  return results
}

// Fetch newest jobs from 求人ボックス for a given query string
async function scrapeKyujinBox(query: string) {
  // The path format: https://求人ボックス.com/keyword-の求人?sort=1 (sort=1 => newest)
  // Use encodeURIComponent then replace %E3%81%AE%E6%B1%82%E4%BA%BA with '-の求人'? We'll instead leverage q param style.
  const searchURL = `https://xn--pckua2a7gp15o89zb.com/${encodeURIComponent(
    query
  )}-の求人?sort=1`
  const results: any[] = []
  try {
    const html = await fetch(encodeURI(searchURL), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Linked/1.0)' },
    }).then((r) => r.text())

    const $ = cheerio.load(html)
    $('div#normalList ul > li').each((_: unknown, el: cheerio.Element) => {
      const title = $(el).find('h3').text().trim()
      const company =
        $(el).find('.c-jobOffer__head__corpName').text().trim() ||
        $(el).find('.p-offer__corpName').text().trim()
      const location = $(el).find('.c-jobOffer__head__corpArea').text().trim()
      const summary = $(el).find('.c-jobOffer__description').text().trim()
      const path = $(el).find('a').attr('href') || ''
      const url = path.startsWith('http')
        ? path
        : `https://求人ボックス.com${path}`
      if (title) {
        results.push({
          source: 'kyujinbox',
          title,
          company,
          location,
          summary,
          url,
        })
      }
    })
  } catch (err) {
    console.error('Failed to scrape KyujinBox:', err)
  }
  return results
}

export async function POST(req: Request) {
  try {
    const { rawText } = await req.json()

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { error: 'rawText is required and must be a string' },
        { status: 400 }
      )
    }

    // 1. Use Gemini to derive search parameters
    const model = google('models/gemini-1.5-pro-latest')

    const { text: searchJson } = await generateText({
      model,
      temperature: 0,
      system: `あなたは人材エージェントのアシスタントです。渡された候補者情報から検索に使うキーワードと勤務地を日本語で抽出してください。以下の JSON スキーマに従って厳密に出力してください。追加のキーは不要です。

{
  "keywords": string[],       // 職種やスキルなど最大5件
  "locations": string[],      // 都道府県やエリア名など (空配列可)
  "must_have_skills": string[],   // 求人に必須のスキル (空配列可)
  "excluded_keywords": string[]   // 除外したいキーワード (空配列可)
}`,
      prompt: rawText,
    })

    const searchSpec = safeJsonParse<{
      keywords: string[]
      locations: string[]
      must_have_skills?: string[]
      excluded_keywords?: string[]
    }>(searchJson)

    // 2. Build query patterns
    const queries = new Set<string>()
    const keywords = searchSpec.keywords || []
    const locations =
      searchSpec.locations && searchSpec.locations.length > 0
        ? searchSpec.locations
        : ['']

    for (const kw of keywords) {
      for (const loc of locations) {
        queries.add(loc ? `${kw} ${loc}` : kw)
      }
    }

    const jobs: any[] = []
    for (const q of Array.from(queries)) {
      const [indeedList, kyujinList] = await Promise.all([
        scrapeIndeed(q),
        scrapeKyujinBox(q),
      ])
      jobs.push(
        ...indeedList.map((j) => ({ ...j, matchQuery: q })),
        ...kyujinList.map((j) => ({ ...j, matchQuery: q }))
      )
    }

    // 3. Basic filtering using must_have_skills / excluded_keywords
    const must = searchSpec.must_have_skills || []
    const excluded = searchSpec.excluded_keywords || []

    const filtered = jobs.filter((job) => {
      const haystack = (
        job.title +
        '\n' +
        job.summary +
        '\n' +
        job.company
      ).toLowerCase()
      const mustOk = must.every((s) => haystack.includes(s.toLowerCase()))
      const exclOk = excluded.every((s) => !haystack.includes(s.toLowerCase()))
      return mustOk && exclOk
    })

    return NextResponse.json(
      {
        searchSpec,
        total: filtered.length,
        jobs: filtered,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in /api/ra:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    )
  }
}
