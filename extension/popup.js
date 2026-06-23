document.addEventListener('DOMContentLoaded', () => {
  const tokenInput = document.getElementById('token')
  const saveBtn = document.getElementById('save')
  const statusDiv = document.getElementById('status')

  // 1. Charger le jeton s'il existe déjà
  chrome.storage.local.get(['extensionToken'], (result) => {
    if (result.extensionToken) {
      tokenInput.value = result.extensionToken
      statusDiv.innerHTML = '<span class="success">Jeton configuré ✔</span>'
    }
  })

  // 2. Enregistrer le jeton au clic
  saveBtn.addEventListener('click', () => {
    const token = tokenInput.value.trim()
    if (!token) {
      statusDiv.textContent = 'Le jeton ne peut pas être vide.'
      statusDiv.style.color = '#ef4444'
      return
    }

    chrome.storage.local.set({ extensionToken: token }, () => {
      statusDiv.innerHTML = '<span class="success">Enregistré ! ✔</span>'
      statusDiv.style.color = '#10b981'
      setTimeout(() => {
        statusDiv.innerHTML = '<span class="success">Jeton configuré ✔</span>'
      }, 1500)
    })
  })
})
