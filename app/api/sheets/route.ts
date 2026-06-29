import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const PUB_KEY = process.env.NEXT_PUBLIC_PUBLISHED_KEY

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gid = searchParams.get('gid')

  if (!PUB_KEY) return NextResponse.json({ error: 'NEXT_PUBLIC_PUBLISHED_KEY not set' }, { status: 500 })
  if (!gid) return NextResponse.json({ error: 'gid param required' }, { status: 400 })

  const url = `https://docs.google.com/spreadsheets/d/e/${PUB_KEY}/pub?gid=${gid}&single=true&output=csv`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    const text = await res.text()

    // Debug: save raw response to file
    const debugPath = path.join(process.cwd(), `debug-gid-${gid}.csv`)
    fs.writeFileSync(debugPath, text, 'utf-8')
    console.log(`[sheets] saved raw response to ${debugPath} (${text.length} chars, status ${res.status})`)

    if (!res.ok) return NextResponse.json({ error: `Sheets returned ${res.status}`, preview: text.slice(0, 500) }, { status: 502 })
    return new NextResponse(text, {
      headers: { 'Content-Type': 'text/csv; charset=utf-8' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
