import * as cheerio from 'cheerio'

export interface ScrapedJobData {
  title: string
  companyName: string
  location?: string
  description?: string
  url: string
  salary?: string
  source: string
}

/**
 * Service de scraping serveur pour extraire les informations des offres d'emploi à partir d'un lien.
 */
export class ScraperService {
  /**
   * Scrape une offre à partir de son URL et de sa source déclarée
   */
  static async scrapeJob(url: string, siteType: 'indeed' | 'hellowork' | 'linkedin'): Promise<ScrapedJobData> {
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }

      const response = await fetch(url, { headers })
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // 1. Récupération des balises OpenGraph pour fallback
      const ogTitle = $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content')
      const ogDescription = $('meta[property="og:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content')
      const ogUrl = $('meta[property="og:url"]').attr('content') || url

      let title = ''
      let companyName = ''
      let location = ''
      let salary = ''
      let description = ''

      // 2. Extraction ciblée selon le site hôte
      if (siteType === 'indeed') {
        title = $('.jobsearch-JobInfoHeader-title').text().trim() || $('h1').text().trim()
        companyName = $('.jobsearch-InlineCompanyRating-companyName').text().trim() || 
                      $('[data-company-name="true"]').text().trim()
        location = $('.jobsearch-InlineCompanyRating-companyLocation').text().trim() || 
                   $('.jobsearch-JobInfoHeader-subtitle div').first().text().trim()
        salary = $('#salaryInfoAndJobType').text().trim() || $('.salary-snippet-container').text().trim()
        description = $('#jobDescriptionText').text().trim()
      } 
      else if (siteType === 'hellowork') {
        title = $('h1').text().trim() || $('.job-header-title').text().trim()
        companyName = $('[data-company-name]').attr('data-company-name') || 
                      $('.job-header-company').text().trim() || 
                      $('.company').text().trim()
        location = $('.job-header-location').text().trim() || $('.location').text().trim()
        salary = $('.job-header-salary').text().trim() || $('.salary').text().trim()
        description = $('.job-description').text().trim() || $('#job-description').text().trim()
      } 
      else if (siteType === 'linkedin') {
        title = $('h1.topcard__title').text().trim() || 
                $('h1').text().trim() || 
                $('.top-card-layout__title').text().trim()
        companyName = $('.topcard__flavor a').first().text().trim() || 
                      $('.topcard__flavor').first().text().trim() || 
                      $('.top-card-layout__first-subline a').first().text().trim()
        location = $('.topcard__flavor--bullet').first().text().trim() || 
                   $('.top-card-layout__first-subline').first().text().trim()
        description = $('.description__text').text().trim() || 
                      $('.show-more-less-html__markup').text().trim()
      }

      // 3. Fallback intelligent si le scraping direct a été bloqué ou a échoué
      if (!title && ogTitle) {
        // L'ogTitle est souvent structuré : "Titre de l'emploi - Entreprise"
        const parts = ogTitle.split(/ chez | at | - /i)
        title = parts[0]?.trim() || ogTitle
        if (parts.length > 1) {
          companyName = parts[1]?.trim() || companyName
        }
      }

      if (!description && ogDescription) {
        description = ogDescription
      }

      // Nettoyer les caractères spéciaux et retours à la ligne superflus
      const cleanText = (str?: string) => str ? str.replace(/\s+/g, ' ').trim() : undefined

      return {
        title: cleanText(title) || 'Nouvelle offre importée',
        companyName: cleanText(companyName) || 'Entreprise externe',
        location: cleanText(location),
        description: description.trim() || undefined,
        url: ogUrl || url,
        salary: cleanText(salary),
        source: siteType.charAt(0).toUpperCase() + siteType.slice(1)
      }
    } catch (e) {
      console.error(`Erreur lors du scraping du lien (${siteType}):`, e)
      
      // Fallback résilient en cas de blocage d'accès (Cloudflare, etc.)
      // Permet de créer la carte avec le lien, plutôt que de faire crasher l'action.
      return {
        title: 'Offre importée par lien',
        companyName: this.extractDomain(url) || 'Entreprise externe',
        url: url,
        source: siteType.charAt(0).toUpperCase() + siteType.slice(1)
      }
    }
  }

  /**
   * Extrait le nom de domaine de l'URL pour un fallback propre
   */
  private static extractDomain(url: string): string | null {
    try {
      const parsedUrl = new URL(url)
      const host = parsedUrl.hostname.replace('www.', '')
      const parts = host.split('.')
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
    } catch {
      return null
    }
  }
}
