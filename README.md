# 🚀 Boardify - CRM de Recherche d'Emploi (Version Locale 100% Autonome)

Cette branche (`local-prod`) est configurée pour fonctionner de manière **totalement autonome en local** sans aucune dépendance externe (sans Docker, sans hébergement en ligne, et sans configuration Google Console). 

L'authentification utilise le système d'identification classique sécurisé (Email / Mot de passe) et la base de données est stockée dans un simple fichier local SQLite (`dev.db`).

---

## 🛠️ Prérequis

Avant de lancer l'application, assurez-vous d'avoir installé sur votre machine :
* [Node.js](https://nodejs.org/) (Version 18 ou supérieure recommandée)

*Note : **Aucun serveur de base de données ni Docker n'est requis**.*

---

## 📋 Étapes de Lancement Local

Suivez ces instructions simples pour exécuter l'application sur votre PC.

### 1. Configurer le fichier d'environnement (.env)
Dupliquez le fichier `.env.example` et renommez-le en `.env` à la racine du projet. Remplissez-le avec les paramètres locaux suivants :
```env
# Connexion à la base de données SQLite locale (Fichier local créé automatiquement)
DATABASE_URL="file:./dev.db"

# Secret NextAuth.js (Générez une chaîne aléatoire sécurisée)
AUTH_SECRET="votre_cle_secrete_aleatoire_de_minimum_32_caracteres"
NEXTAUTH_URL="http://localhost:3000"

# URL de l'API locale
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Clé API Google Maps (Optionnel mais recommandé pour afficher les cartes interactives)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyACZPOdiJamOGaGW1sf27tpPOQYkaQLnI0"
```

### 2. Installer les dépendances
Installez les packages Node :
```bash
npm install
```

### 3. Initialiser et synchroniser la base de données
Exécutez la commande suivante pour créer automatiquement le fichier de base de données local `dev.db` et y injecter les tables :
```bash
npx prisma db push
```

### 4. Compiler l'application pour la production
Générez le build optimisé de production :
```bash
npm run build
```

### 5. Lancer le serveur local de production
Démarrez l'application localement :
```bash
npm run start
```

---

## 💻 Accès à l'application
Une fois le serveur démarré, ouvrez votre navigateur et accédez à :
👉 **[http://localhost:3000](http://localhost:3000)**

* Créez votre compte directement en cliquant sur **"Créer un compte"** via le formulaire classique (Email / Mot de passe).
* Toutes vos données de candidatures, CV, notes et rappels de tâches seront sauvegardées de manière sécurisée en local dans le fichier `prisma/dev.db` sur votre PC.
