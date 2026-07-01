# 🚀 Boardify - CRM de Recherche d'Emploi (Version Bureau & Locale)

**Boardify** est un CRM personnel conçu pour centraliser, organiser et suivre vos candidatures d'emploi. L'application est configurée pour fonctionner de manière **100% autonome et locale** (vos données restent sur votre ordinateur).

Elle peut être lancée de deux manières :
1. **En tant qu'Application de Bureau (Recommandé) :** Une application native portable (Electron) autonome.
2. **Dans le Navigateur :** Une application Web locale démarrée via Node.js.

---

## 💻 1. Version Bureau (Recommandé - Electron)

Cette version encapsule Boardify dans un exécutable Windows portable autonome. L'utilisateur final n'a **pas besoin d'installer Node.js** ni de lancer des commandes de terminal.

### 💾 Persistance des Données Sécurisée
*   La base de données SQLite est automatiquement stockée dans le répertoire des données utilisateur du système (`%APPDATA%/boardify/dev.db` sous Windows).
*   **Sécurité des mises à jour :** Vous pouvez mettre à jour l'application en téléchargeant une nouvelle version sans jamais risquer de perdre vos données ou candidatures existantes.

### 🛠️ Compiler l'application de bureau (Développeurs)
Si vous souhaitez compiler vous-même l'application de bureau sous forme de fichier portable `.exe` :

1.  Assurez-vous d'avoir installé [Node.js](https://nodejs.org/).
2.  Installez les dépendances :
    ```bash
    npm install
    ```
3.  Initialisez la base de données locale temporaire pour le build :
    ```bash
    npx prisma db push
    ```
4.  Lancez le script de compilation Desktop :
    ```bash
    npm run build:desktop
    ```
5.  Retrouvez votre exécutable prêt à l'emploi dans le dossier **`dist/Boardify 1.0.0.exe`**.

---

## 🌐 2. Version Navigateur (Node.js local)

Si vous préférez exécuter l'application sous forme de site web local dans votre navigateur :

### 🚀 Lancement Automatique (Windows)
1.  Double-cliquez sur le fichier **`lancer.bat`** présent à la racine du projet.
2.  Le script configure le fichier `.env`, installe les dépendances, synchronise la base SQLite locale, compile et lance le serveur.
3.  Votre navigateur s'ouvre automatiquement sur [http://localhost:3000](http://localhost:3000).

### 📋 Lancement Manuel (Toutes plateformes)
1.  Configurez votre fichier `.env` en copiant le fichier `.env.example`.
2.  Installez les packages :
    ```bash
    npm install
    ```
3.  Synchronisez la base de données :
    ```bash
    npx prisma db push
    ```
4.  Compilez et lancez l'application :
    ```bash
    npm run build
    npm run start
    ```

---

## ✨ Fonctionnalités Clés

*   **Tableau Kanban Interactif :** Glissez-déposez vos candidatures pour changer leur statut (À postuler, Postulé, Entretien, Offre reçue, Refusé).
*   **Import Excel & CSV intelligent :** Importez en masse vos offres existantes en mappant facilement vos colonnes.
*   **Import par lien (Scraping local) :** Collez un lien d'offre d'emploi (LinkedIn, Indeed, HelloWork) pour extraire automatiquement les informations du poste.
*   **A/B Testing de CV :** Suivez quel CV génère le plus d'entretiens via le dashboard analytique.
*   **Dashboard Analytique :** Visualisez vos statistiques clés, taux de réponse, répartition géographique et historique de candidatures.
*   **Gestion des Tâches :** Planifiez vos relances et mémorisez vos entretiens dans un calendrier de tâches intégré.
