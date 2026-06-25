# 🚀 Boardify

CRM local et interactif de suivi de recherche d'emploi (Kanban, statistiques de CV, géolocalisation et agenda).

## 🛠️ Installation & Lancement rapide

1. **Lancer la base de données (Docker) :**
   ```bash
   docker compose up -d
   ```

2. **Configurer l'environnement :**
   Copiez `.env.example` vers `.env` et configurez les variables.

3. **Installer les dépendances & synchroniser la base de données :**
   ```bash
   npm install
   npx prisma db push
   ```

4. **Lancer l'application en développement :**
   ```bash
   npm run dev
   ```

5. **Lancer l'application en production :**
   ```bash
   npm run build
   npm run start
   ```

Accès à l'application sur : **[http://localhost:3000](http://localhost:3000)**.
