const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const http = require('http')

let serverProcess = null
let mainWindow = null

// Port de l'application
const PORT = process.env.PORT || 3030

// Détermination du chemin de la base de données SQLite persistante dans AppData
const userDataPath = app.getPath('userData')
const dbPath = path.join(userDataPath, 'dev.db')

// 1. Initialisation de la base de données
function initDatabase() {
  console.log('Database path:', dbPath)
  if (!fs.existsSync(dbPath)) {
    console.log('Database not found in AppData. Copying default dev.db...')
    const defaultDbPath = path.join(__dirname, 'dev.db')
    try {
      if (fs.existsSync(defaultDbPath)) {
        fs.copyFileSync(defaultDbPath, dbPath)
        console.log('Database copied successfully!')
      } else {
        console.warn('Default database dev.db not found in bundle!')
      }
    } catch (err) {
      console.error('Failed to copy default database:', err)
    }
  }
}

// 2. Lancement du serveur Next.js Standalone
function startNextServer() {
  initDatabase()

  const serverScript = path.join(__dirname, 'server.js')
  console.log('Starting Next.js server at:', serverScript)

  // On lance le processus Next.js en utilisant l'exécutable Electron configuré en mode Node
  serverProcess = spawn(process.execPath, [serverScript], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: PORT.toString(),
      DATABASE_URL: `file:${dbPath}`,
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production'
    },
    stdio: 'pipe'
  })

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Next.js Server]: ${data}`)
  })

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Next.js Server Error]: ${data}`)
  })

  serverProcess.on('close', (code) => {
    console.log(`Next.js server exited with code ${code}`)
  })
}

// 3. Vérification si le serveur est prêt
function checkServerReady(callback, attempts = 0) {
  if (attempts > 50) {
    console.error('Next.js server failed to start in time.')
    app.quit()
    return
  }

  const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
    if (res.statusCode === 200 || res.statusCode === 302 || res.statusCode === 404) {
      console.log('Server is ready!')
      callback()
    } else {
      setTimeout(() => checkServerReady(callback, attempts + 1), 200)
    }
  })

  req.on('error', () => {
    setTimeout(() => checkServerReady(callback, attempts + 1), 200)
  })
}

// 4. Création de la fenêtre Electron
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Boardify',
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Cacher la barre de menu supérieure par défaut (Alt pour la voir)
  mainWindow.removeMenu()

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Cycle de vie de l'application
app.whenReady().then(() => {
  startNextServer()
  checkServerReady(() => {
    createWindow()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) {
      serverProcess.kill()
    }
    app.quit()
  }
})

app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
})
