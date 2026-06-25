@echo off
title Boardify - Chargement...
color 0B
echo ======================================================================
echo           BOARDIFY - CRM DE RECHERCHE D'EMPLOI LOCAL
echo ======================================================================
echo.

:: 1. Verification de Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERREUR] Node.js n'est pas installe sur votre machine.
    echo Veuillez installer Node.js depuis https://nodejs.org/ avant de continuer.
    echo.
    pause
    exit /b
)

:: 2. Configuration du fichier .env
if not exist .env (
    echo [INFO] Configuration du fichier .env initial...
    copy .env.example .env >nul
    
    :: Generation d'un secret aleatoire via PowerShell
    echo [INFO] Generation d'une cle de securite unique...
    for /f "tokens=*" %%a in ('powershell -Command "[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes(($bytes = New-Object Byte[] 32)); [System.BitConverter]::ToString($bytes).Replace('-', '').ToLower()"') do set RANDOM_SECRET=%%a
    
    :: Remplacement du secret dans le fichier .env
    powershell -Command "(gc .env) -replace 'votre_cle_secrete_aleatoire_de_minimum_32_caracteres', '%RANDOM_SECRET%' | Out-File -encoding ASCII .env"
)

:: 3. Installation des dependances
if not exist node_modules (
    echo [INFO] Installation des dependances (npm install)...
    echo Cela peut prendre une minute...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERREUR] L'installation des dependances a echoue.
        pause
        exit /b
    )
)

:: 4. Synchronisation de la base de donnees
if not exist dev.db (
    echo [INFO] Initialisation de la base de donnees locale SQLite...
    call npx prisma db push
    if %errorlevel% neq 0 (
        color 0C
        echo [ERREUR] L'initialisation de la base de donnees a echoue.
        pause
        exit /b
    )
)

:: 5. Compilation de l'application (si .next n'existe pas)
if not exist .next (
    echo [INFO] Compilation de l'application en mode production...
    call npm run build
    if %errorlevel% neq 0 (
        color 0C
        echo [ERREUR] La compilation de l'application a echoue.
        pause
        exit /b
    )
)

:: 6. Lancement du serveur et ouverture du navigateur
echo.
echo ======================================================================
echo           BOARDIFY EST PRET !
echo ======================================================================
echo [INFO] Lancement de l'application en cours...
echo [INFO] Votre navigateur va s'ouvrir automatiquement sur :
echo        http://localhost:3000
echo ======================================================================
echo.

:: Ouvre l'url dans le navigateur par defaut
start http://localhost:3000

:: Lance le serveur en mode production
call npm run start

pause
