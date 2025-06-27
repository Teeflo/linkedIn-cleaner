# LinkedIn Cleaner

*Reprenez le contrôle de votre réseau professionnel, en un seul clic.*

LinkedIn Cleaner est une extension Chrome minimaliste qui aide à gérer et nettoyer votre liste de connexions LinkedIn. Elle supprime automatiquement les relations affichées sur la page en simulant un comportement humain avec des pauses aléatoires.

## Installation
1. Clonez ce dépôt.
2. Ouvrez Chrome et rendez-vous sur `chrome://extensions`.
3. Activez le mode développeur puis choisissez **Charger l'extension non empaquetée** et sélectionnez ce dossier.

## Utilisation
1. Naviguez vers votre page de connexions LinkedIn : `https://www.linkedin.com/mynetwork/invite-connect/connections/`.
2. Cliquez sur l'icône de l'extension et appuyez sur **Nettoyer cette page**.
3. Les contacts visibles seront retirés un par un avec confirmation automatique. Rechargez la page pour traiter un nouveau lot si nécessaire.

## À qui s'adresse cette extension ?
- Les professionnels en transition de carrière qui souhaitent réorienter leur réseau.
- Les utilisateurs actifs dont la liste de connexions est devenue ingérable.
- Les experts en marketing et vente qui veulent affiner leur audience.
- Toute personne soucieuse de la qualité plutôt que de la quantité.

## Fonctionnement
L'extension vérifie que vous êtes bien sur la page des connexions avant de lancer le script. Elle ouvre le menu d'actions de chaque contact, clique sur **Retirer la relation**, confirme la suppression et attend 1,5 à 2 secondes entre chaque contact pour reproduire un rythme humain.
