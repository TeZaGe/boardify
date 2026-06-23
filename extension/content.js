/**
 * Content Script injecté dans Indeed et HelloWork.
 * Extrait les données de l'offre et injecte le bouton de clip dans un Shadow DOM.
 */

const scrapeIndeed = () => {
  const title = document.querySelector('.jobsearch-JobInfoHeader-title')?.innerText || 
                document.querySelector('h1')?.innerText || 
                'Poste inconnu';
  
  const company = document.querySelector('[data-company-name="true"]')?.innerText || 
                  document.querySelector('.jobsearch-InlineCompanyRating-companyName')?.innerText ||
                  document.querySelector('.jobsearch-InlineCompanyRating-companyName a')?.innerText ||
                  'Entreprise inconnue';
                  
  const location = document.querySelector('.jobsearch-JobInfoHeader-subtitle div')?.innerText || 
                   document.querySelector('.jobsearch-InlineCompanyRating-companyLocation')?.innerText || 
                   'France';

  const salary = document.querySelector('#salaryInfoAndJobType')?.innerText || 
                 document.querySelector('.salary-snippet-container')?.innerText || 
                 null;

  const description = document.querySelector('#jobDescriptionText')?.innerText || '';

  return {
    title: title.trim(),
    companyName: company.replace(/-\s*$/, '').trim(), // Nettoie le tiret de fin d'Indeed
    location: location.trim(),
    description: description.trim(),
    url: window.location.href,
    salary: salary ? salary.trim() : null,
    source: 'Indeed'
  }
}

const scrapeHelloWork = () => {
  const title = document.querySelector('h1')?.innerText || 
                document.querySelector('.job-header-title')?.innerText || 
                'Poste inconnu';
  
  const company = document.querySelector('[data-company-name]')?.getAttribute('data-company-name') ||
                  document.querySelector('.job-header-company')?.innerText ||
                  document.querySelector('.company')?.innerText ||
                  'Entreprise inconnue';

  const location = document.querySelector('.job-header-location')?.innerText ||
                   document.querySelector('.location')?.innerText ||
                   'France';

  const salary = document.querySelector('.job-header-salary')?.innerText ||
                 document.querySelector('.salary')?.innerText ||
                 null;

  const description = document.querySelector('.job-description')?.innerText || 
                      document.querySelector('#job-description')?.innerText || 
                      '';

  return {
    title: title.trim(),
    companyName: company.trim(),
    location: location.trim(),
    description: description.trim(),
    url: window.location.href,
    salary: salary ? salary.trim() : null,
    source: 'HelloWork'
  }
}

const injectButton = (scrapeData) => {
  // Empêche la duplication du bouton
  if (document.getElementById('jobby-clipper-root')) {
    document.getElementById('jobby-clipper-root').remove()
  }

  const container = document.createElement('div')
  container.id = 'jobby-clipper-root'
  container.style.position = 'fixed'
  container.style.bottom = '24px'
  container.style.right = '24px'
  container.style.zIndex = '2147483647' // Porté au max pour passer devant les modales

  const shadow = container.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = `
    .jobby-btn {
      background: linear-gradient(135deg, #8b5cf6 0%, #10b981 100%);
      color: white;
      border: none;
      padding: 12px 22px;
      border-radius: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4), 
                  0 0 20px rgba(139, 92, 246, 0.2);
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .jobby-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px rgba(139, 92, 246, 0.4),
                  0 0 30px rgba(16, 185, 129, 0.3);
    }
    .jobby-btn:active {
      transform: translateY(0);
    }
    .jobby-btn:disabled {
      opacity: 0.8;
      cursor: not-allowed;
    }
    .jobby-btn.success {
      background: #10b981;
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
    }
    .jobby-btn.error {
      background: #ef4444;
      box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
    }
    svg {
      width: 16px;
      height: 16px;
    }
  `

  const button = document.createElement('button')
  button.className = 'jobby-btn'
  button.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    Ajouter à Jobby
  `

  button.addEventListener('click', () => {
    button.disabled = true
    button.innerHTML = 'Connexion à Jobby...'

    // Récupère le jeton depuis le stockage d'extension
    chrome.storage.local.get(['extensionToken'], (result) => {
      const token = result.extensionToken || ''
      const payload = scrapeData()

      fetch('http://localhost:3000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (res.status === 201 || res.status === 200) {
          button.className = 'jobby-btn success'
          button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Ajouté !
          `
        } else {
          throw new Error('API Error')
        }
      })
      .catch(err => {
        console.error('Jobby Clipper API error:', err)
        button.className = 'jobby-btn error'
        button.innerHTML = 'Erreur d\'envoi'
        setTimeout(() => {
          button.className = 'jobby-btn'
          button.disabled = false
          button.innerHTML = 'Ajouter à Jobby'
        }, 2000)
      })
    })
  })

  shadow.appendChild(style)
  shadow.appendChild(button)
  document.body.appendChild(container)
}

const init = () => {
  const url = window.location.href
  
  // Détecte si nous sommes sur une fiche d'offre d'emploi
  if (url.includes('indeed.com') || url.includes('indeed.fr')) {
    // Indeed charge le contenu asynchronement dans des SPA, on temporise
    setTimeout(() => {
      // Injecte uniquement sur les pages de détails d'offres
      if (url.includes('/viewjob') || url.includes('/rc/clk') || document.querySelector('.jobsearch-JobInfoHeader-title')) {
        injectButton(scrapeIndeed)
      }
    }, 1500)
  } else if (url.includes('hellowork.com')) {
    setTimeout(() => {
      if (url.includes('/emplois/') || document.querySelector('.job-header-title') || document.querySelector('h1')) {
        injectButton(scrapeHelloWork)
      }
    }, 1500)
  }
}

// Initialisation
init()

// Écouteur de changement d'URL pour Indeed / Hellowork qui naviguent en SPA
let lastUrl = window.location.href
const observer = new MutationObserver(() => {
  const currentUrl = window.location.href
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl
    init()
  }
})
observer.observe(document, { subtree: true, childList: true })
