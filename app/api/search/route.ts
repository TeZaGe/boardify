import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { JobSearchService } from '@/services/search'

// Validateur de paramètres d'entrée avec Zod
const searchSchema = z.object({
  q: z.string().max(100).default(''), // Mots clés
  l: z.string().max(100).default('')  // Localisation
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validation
    const validation = searchSchema.safeParse({
      q: searchParams.get('q') || undefined,
      l: searchParams.get('l') || undefined
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Paramètres de recherche invalides.', details: validation.error.format() } },
        { status: 400 }
      )
    }

    const { q, l } = validation.data
    const results = await JobSearchService.search(q, l)

    return NextResponse.json({ results })
  } catch (e) {
    console.error('API Search Route Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Une erreur interne est survenue.' } },
      { status: 500 }
    )
  }
}
