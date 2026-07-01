const { execSync } = require('child_process')
const fs = require('fs-extra') // wait, fs-extra might not be installed, let's use standard fs
const fsStd = require('fs')
const path = require('path')

// Helper recursif pour copier des dossiers
function copyFolderSync(from, to) {
  if (!fsStd.existsSync(from)) return
  if (!fsStd.existsSync(to)) {
    fsStd.mkdirSync(to, { recursive: true })
  }
  fsStd.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element)
    const toPath = path.join(to, element)
    if (fsStd.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath)
    } else {
      fsStd.copyFileSync(fromPath, toPath)
    }
  })
}

async function build() {
  console.log('--- 1. Compilation de Next.js (production/standalone) ---')
  execSync('npm run build', { stdio: 'inherit' })

  console.log('--- 2. Préparation du dossier de build Desktop ---')
  const standaloneDir = path.join(__dirname, '.next', 'standalone')
  
  if (!fsStd.existsSync(standaloneDir)) {
    throw new Error('Dossier .next/standalone introuvable. Vérifiez la compilation Next.js.')
  }

  // Copier le dossier public
  console.log('Copie du dossier public...')
  copyFolderSync(
    path.join(__dirname, 'public'),
    path.join(standaloneDir, 'public')
  )

  // Copier le dossier .next/static
  console.log('Copie du dossier .next/static...')
  copyFolderSync(
    path.join(__dirname, '.next', 'static'),
    path.join(standaloneDir, '.next', 'static')
  )

  // Copier le script principal Electron
  console.log('Copie du script main.js...')
  fsStd.copyFileSync(
    path.join(__dirname, 'electron-main.js'),
    path.join(standaloneDir, 'main.js')
  )

  // Copier la base de données SQLite de base
  console.log('Copie de la base de données SQLite dev.db...')
  fsStd.copyFileSync(
    path.join(__dirname, 'dev.db'),
    path.join(standaloneDir, 'dev.db')
  )

  // Création du package.json spécifique pour le packaging
  console.log('Création du package.json de production...')
  const pkg = {
    name: 'boardify',
    version: '1.0.0',
    description: 'Boardify CRM de recherche d\'emploi',
    main: 'main.js',
    author: 'Thomas',
    license: 'MIT'
  }
  fsStd.writeFileSync(
    path.join(standaloneDir, 'package.json'),
    JSON.stringify(pkg, null, 2)
  )

  console.log('--- 3. Lancement du packaging avec electron-builder ---')
  // Exécution d'electron-builder
  // On passe les configurations en ligne de commande pour spécifier le répertoire source (.next/standalone)
  // et les configurations de packaging (icône, etc.)
  const builderConfig = {
    appId: 'com.boardify.app',
    productName: 'Boardify',
    directories: {
      output: path.join(__dirname, 'dist'),
      app: standaloneDir
    },
    win: {
      target: ['portable'], // Crée un exécutable portable (.exe autonome sans installeur lourd)
      icon: path.join(__dirname, 'public', 'favicon.ico')
    },
    files: [
      '**/*'
    ],
    asar: true // Active la compression ASAR pour protéger les fichiers
  }

  const configPath = path.join(__dirname, 'electron-builder-config.json')
  fsStd.writeFileSync(configPath, JSON.stringify(builderConfig, null, 2))

  try {
    execSync(`npx electron-builder --config ${configPath}`, { stdio: 'inherit' })
    console.log('--- Packaging terminé avec succès ! L\'exécutable se trouve dans le dossier ./dist/ ---')
  } catch (err) {
    console.error('Erreur lors du packaging avec electron-builder:', err)
    process.exit(1)
  } finally {
    // Nettoyer la config temporaire
    if (fsStd.existsSync(configPath)) {
      fsStd.unlinkSync(configPath)
    }
  }
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})
