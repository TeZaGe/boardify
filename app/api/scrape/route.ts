import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ScraperService } from '@/services/scraper'

// Schéma de validation des paramètres de requête de scraping
const scrapeRequestSchema = z.object({
  url: z.string().url('L\'URL fournie doit être valide.'),
  siteType: z.enum(['indeed', 'hellowork', 'linkedin'])
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = scrapeRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'URL ou source invalide.', details: validation.error.format() } },
        { status: 400 }
      )
    }

    const { url, siteType } = validation.data
    const jobData = await ScraperService.scrapeJob(url, siteType)

    return NextResponse.json({ jobData })
  } catch (e) {
    console.error('API Scrape Route Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors du scraping serveur de l\'offre.' } },
      { status: 500 }
    )
  }
}
