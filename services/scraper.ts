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

      // 2. Extraction structurée via JSON-LD (JobPosting) si disponible
      let ldTitle = ''
      let ldCompanyName = ''
      let ldLocation = ''
      let ldSalary = ''
      let ldDescription = ''

      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const content = $(el).text().trim()
          const data = JSON.parse(content)
          
          const processJobPosting = (item: any) => {
            if (item?.['@type'] === 'JobPosting') {
              if (item.title) ldTitle = item.title
              if (item.hiringOrganization?.name) ldCompanyName = item.hiringOrganization.name
              
              if (item.jobLocation) {
                const loc = item.jobLocation
                if (loc.address) {
                  const addr = loc.address
                  ldLocation = addr.addressLocality || addr.addressRegion || addr.addressCountry || ''
                } else if (typeof loc === 'string') {
                  ldLocation = loc
                } else if (loc.name) {
                  ldLocation = loc.name
                }
              }
              
              if (item.description) {
                const descText = cheerio.load(item.description).text().trim()
                ldDescription = descText || item.description
              }
              
              if (item.baseSalary) {
                const sal = item.baseSalary
                if (sal.value) {
                  if (typeof sal.value === 'object') {
                    const val = sal.value
                    const min = val.minValue || val.value
                    const max = val.maxValue
                    const currency = sal.currency || 'EUR'
                    if (min && max) {
                      ldSalary = `${min} - ${max} ${currency}`
                    } else if (min) {
                      ldSalary = `${min} ${currency}`
                    }
                  } else {
                    ldSalary = String(sal.value)
                  }
                }
              }
            }
          }

          if (Array.isArray(data)) {
            data.forEach(processJobPosting)
          } else {
            processJobPosting(data)
          }
        } catch (e) {
          // Ignorer les erreurs d'analyse JSON
        }
      })

      let title = ldTitle
      let companyName = ldCompanyName
      let location = ldLocation
      let salary = ldSalary
      let description = ldDescription

      // 3. Extraction ciblée selon le site hôte si les valeurs JSON-LD manquent
      if (siteType === 'indeed') {
        if (!title) title = $('.jobsearch-JobInfoHeader-title').text().trim() || $('h1').text().trim()
        if (!companyName) {
          companyName = $('.jobsearch-InlineCompanyRating-companyName').text().trim() || 
                        $('[data-company-name="true"]').text().trim()
        }
        if (!location) {
          location = $('.jobsearch-InlineCompanyRating-companyLocation').text().trim() || 
                     $('.jobsearch-JobInfoHeader-subtitle div').first().text().trim()
        }
        if (!salary) salary = $('#salaryInfoAndJobType').text().trim() || $('.salary-snippet-container').text().trim()
        if (!description) description = $('#jobDescriptionText').text().trim()
      } 
      else if (siteType === 'hellowork') {
        if (!title) {
          const titleEl = $('h1').clone()
          titleEl.find('a, span, div, p').remove()
          title = titleEl.text().trim() || $('.job-header-title').text().trim()
        }
        if (!companyName) {
          companyName = $('a[href*="/entreprises/"]').filter((_, el) => $(el).text().trim().length > 0).first().text().trim() ||
                        $('[data-company-name]').attr('data-company-name') || 
                        $('.job-header-company').text().trim() || 
                        $('.company').text().trim()
        }
        if (!location) location = $('.job-header-location').text().trim() || $('.location').text().trim()
        if (!salary) salary = $('.job-header-salary').text().trim() || $('.salary').text().trim()
        if (!description) description = $('.job-description').text().trim() || $('#job-description').text().trim()
      } 
      else if (siteType === 'linkedin') {
        if (!title) {
          title = $('h1.topcard__title').text().trim() || 
                  $('h1').text().trim() || 
                  $('.top-card-layout__title').text().trim()
        }
        if (!companyName) {
          companyName = $('.topcard__flavor a').first().text().trim() || 
                        $('.topcard__flavor').first().text().trim() || 
                        $('.top-card-layout__first-subline a').first().text().trim()
        }
        if (!location) {
          location = $('.topcard__flavor--bullet').first().text().trim() || 
                     $('.top-card-layout__first-subline').first().text().trim()
        }
        if (!description) {
          description = $('.description__text').text().trim() || 
                        $('.show-more-less-html__markup').text().trim()
        }
      }

      // 4. Fallback intelligent si le scraping direct a été bloqué ou a échoué
      if (!title && ogTitle) {
        const parts = ogTitle.split(/ chez | at | - /i)
        title = parts[0]?.trim() || ogTitle
        if (parts.length > 1 && !companyName) {
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
