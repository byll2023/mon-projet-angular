import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import emailjs from '@emailjs/browser';
import { environment } from '../../environments/environment';


interface Joueur {
  prenom: string;
  token: string;
  tentatives: number;
}

interface Avis {
  image: string;
  message: string;
  nom: string;
  ville: string;
}

@Component({
  selector: 'app-jeu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jeu.html',
  styleUrls: ['./jeu.css']
})
export class JeuComponent implements OnInit {

  // Jeu
  codeComplet: string = '';
  indexManquant: number = 0;
  lettreCorrecte: string = '';
  codeAffiche: string = '---';
  lettreSaisie: string = '';
  chrono: number = 40;
  timer!: ReturnType<typeof setInterval>;
  maxBonus: number = 3; // utilisé comme nombre max d'invitations validées
  invites: number = 0;
  lettresGagnantes: string[] = ['X', 'I', 'W', 'Y', 'U'];

  // Joueur inscription
  prenom: string = '';
  email: string = '';
  accepterNewsletter: boolean = false;
  joueurActuel?: Joueur; // ← ici, avec les autres variables joueur
  invitationEnvoyee: boolean = false;
  // Adresse livraison
  prenomLivraison: string = '';
  adresse: string = '';
  ville: string = '';
  codePostal: string = '';

  // Stockage local des joueurs
  emailsInscrits: { [key: string]: Joueur } = {};

  // Affichage / états
  afficherInscription: boolean = false;
  afficherJeu: boolean = false;
  afficherBonus: boolean = false;
  bonusDisponible: boolean = true;
  afficherAdresse: boolean = false;
  compteurBonus: number = 0; // number of remaining valid invites to reach maxBonus
  resultatMessage: string = '';
  resultColor: string = 'black';
  // NOTE: lienParrainage n'est PAS affiché sur la page selon ta demande
  lienParrainage: string = '';
  afficherCode: boolean = true;
  afficherChrono: boolean = true;

  // Nouveau : empêcher plusieurs soumissions dans la même manche
  tentativeEnCours: boolean = false;

  // Nouveau : stocker les e-mails des amis validés pour chaque parrain
  // sauvegardés en localStorage sous clé: sponsor + '_friends' => JSON array
  // ex: localStorage.getItem('alice@example.com_friends') => '["ami1@ex","ami2@ex"]'

  avisGagnants: Avis[] = [
    { image: 'assets/images/gagnant1.jpg', message: 'Super confortables, j’adore !', nom: 'Marie', ville: 'Montréal' },
    { image: 'assets/images/gagnant2.jpg', message: 'Merci Ferargile 🎉 je suis trop content !', nom: 'Karim', ville: 'Québec' },
    { image: 'assets/images/gagnant3.jpg', message: 'Chaussettes douces et chaudes, parfaites pour l’hiver.', nom: 'Sophie', ville: 'Laval' },
  ];

  // ================= INIT =================
  ngOnInit(): void {
    this.emailsInscrits = JSON.parse(localStorage.getItem('emailsJeu') || '{}');

    // Vérifier si l'URL contient un token d'invitation (lorsqu'un ami clique sur le lien et s'inscrit)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenInvite = urlParams.get('invite');

    if (tokenInvite) {
      // Si la page est visitée avec ?invite=TOKEN, on suppose que la personne s'inscrit (ou est déjà inscrite).
      // On parcourt les joueurs pour trouver le parrain (celui dont le token correspond).
      for (let mail in this.emailsInscrits) {
        const joueur = this.emailsInscrits[mail];
        if (!joueur) continue;

        if (joueur.token === tokenInvite) {
          // Si un visiteur (ami) vient avec ce token et s'inscrit (côté front on suppose qu'il a fourni son e-mail),
          // on ne peut pas forcer une inscription automatique : il faudra appeler cette logique depuis la page d'inscription.
          // Mais on peut -- si l'ami a un param 'registerEmail' dans l'URL (ex: ?invite=...&registerEmail=ami@ex) -- le traiter.
          const registeringEmail = urlParams.get('registerEmail');
          if (registeringEmail) {
            const friendLower = registeringEmail.toLowerCase();
            // ne pas compter si friend est le même que le parrain
            if (friendLower === mail) {
              // ne rien faire
            } else {
              // charger la liste d'amis validés du parrain
              const keyFriends = mail + '_friends';
              const friendsList: string[] = JSON.parse(localStorage.getItem(keyFriends) || '[]');

              // si l'ami n'était pas déjà compté ET l'ami existe comme utilisateur (inscrit dans emailsJeu),
              // alors on l'ajoute à la liste du parrain et on incrémente le compteur d'invites si < maxBonus.
              // L'intention : un ami doit **s'inscrire** après avoir reçu le lien pour être compté.
              if (!friendsList.includes(friendLower)) {
                // on vérifie que l'ami est bien inscrit (a un compte)
                if (this.emailsInscrits[friendLower]) {
                  friendsList.push(friendLower);
                  localStorage.setItem(keyFriends, JSON.stringify(friendsList));
                  // mettre à jour le nombre d'invites validées
                  const invites = parseInt(localStorage.getItem(mail + '_invites') || '0', 10);
                  if (invites < this.maxBonus) {
                    localStorage.setItem(mail + '_invites', (invites + 1).toString());
                  }
                  // prévenir le parrain (alerte) si la page est chargée par le parrain après l'évènement
                  // (ici on ne fait pas d'alert automatique pour ne pas déranger)
                }
              }
            }
          } else {
            // Si l'ami n'a pas fourni registerEmail, on gère le cas existant (par ex: le parrain clique son lien)
            // Rien d'autre à faire
          }
          break;
        }
      }
    }
  }

  // ================= INSCRIPTION =================
  afficherFormulaire(): void {
    this.afficherInscription = true;
    setTimeout(() => document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth' }));
  }

  inscription(): void {
    const emailLower = this.email.toLowerCase();
    let joueur = this.emailsInscrits[emailLower];

    // Si le joueur n'existe pas, on le crée
    if (!joueur) {
      const token = btoa(emailLower + Date.now());
      this.emailsInscrits[emailLower] = { prenom: this.prenom || 'Participant', token, tentatives: 0 };
      joueur = this.emailsInscrits[emailLower]; // ← récupère l'objet créé
      localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));

      // initialiser invites et friends si absent
      if (!localStorage.getItem(emailLower + '_invites')) {
        localStorage.setItem(emailLower + '_invites', '0');
      }
      if (!localStorage.getItem(emailLower + '_friends')) {
        localStorage.setItem(emailLower + '_friends', JSON.stringify([]));
      }
    }

    this.joueurActuel = joueur; // maintenant joueurActuel est bien défini
    this.majCompteur(emailLower);

    // Si joueur existe et a >=1 tentatives, on lui dit d’inviter un ami (logique conservée)
    if (joueur.tentatives >= 1 && this.compteurBonus > 0) {
      this.resultatMessage = `❌ Vous avez atteint le maximum de tentatives ! Invitez 3 amis pour obtenir une seconde chance (${this.maxBonus - this.compteurBonus}/${this.maxBonus} utilisés).`;
      this.resultColor = 'red';
      this.afficherBonus = true;
      this.afficherJeu = true;
      return;
    }

    // Sinon, démarrer le jeu normalement
    this.afficherJeu = true;
    this.nouvellePartie();
    this.startTimer();

    setTimeout(() => document.getElementById('jeuSection')?.scrollIntoView({ behavior: 'smooth' }));
  }

  majCompteur(email: string): void {
    // met à jour compteur des invitations restantes pour affichage
    const invites = parseInt(localStorage.getItem(email + '_invites') || '0', 10);
    const restant = this.maxBonus - invites;
    this.compteurBonus = restant >= 0 ? restant : 0;
    this.bonusDisponible = invites < this.maxBonus;
  }

  // ================== LOGIQUE DU JEU ==================
  genererCode(longueur: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: longueur }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }

  nouvellePartie(): void {
    this.afficherCode = true;
    this.afficherChrono = true;
    this.codeComplet = this.genererCode();
    let codeArray = this.codeComplet.split('');

    // choisir un index manquant qui n'est pas un numéro
    do {
      this.indexManquant = Math.floor(Math.random() * codeArray.length);
    } while (!isNaN(Number(codeArray[this.indexManquant])));

    this.lettreCorrecte = this.lettresGagnantes[Math.floor(Math.random() * this.lettresGagnantes.length)];
    codeArray[this.indexManquant] = '_';
    this.codeAffiche = codeArray.join(' ');

    this.resultatMessage = '';
    this.lettreSaisie = '';
    this.afficherBonus = false;

    // autoriser une seule soumission pendant la manche
    this.tentativeEnCours = true;
  }

  verifierCode(): void {
    // empêcher plusieurs soumissions dans la même manche
    if (!this.tentativeEnCours) return;

    const input = this.lettreSaisie.toUpperCase();
    const emailLower = this.email.toLowerCase();
    const joueur = this.joueurActuel;

    if (!joueur) {
      alert('Veuillez vous inscrire avant de jouer.');
      return;
    }

    // marquer la tentative comme consommée pour la manche actuelle
    this.tentativeEnCours = false;
    joueur.tentatives++;
    localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));

    if (input === this.lettreCorrecte) {
      clearInterval(this.timer);
      this.resultatMessage = '🎉 Félicitations ! Vous avez trouvé la bonne lettre 🎯';
      this.resultColor = 'green';
      this.chrono = 0;

      // Masquer le code et le chrono
      this.afficherCode = false;
      this.afficherChrono = false;
      this.invitationEnvoyee = true;   // 👉 masque chrono + code

      // notifier admin (toujours)
      this.envoyerNotifAdmin(`Le joueur ${joueur.prenom} (${emailLower}) a gagné le jeu.`);

      setTimeout(() => document.getElementById('btnContinuer')?.scrollIntoView({ behavior: 'smooth' }), 300);

    } else {
      // mauvaise lettre -> envoyer automatiquement l'email d'invitation au joueur
      this.resultatMessage = '❌ Mauvais choix... un email d\'invitation vous a été envoyé pour débloquer une seconde chance (si 3 amis s\'inscrivent).';
      this.resultColor = 'red';
      this.afficherCode = false;
      this.afficherChrono = false;


      // on envoie le mail d'invitation au joueur (il devra l'envoyer à 3 amis)
      this.envoyerInvitationAuJoueur(emailLower);

      // notifier admin (toujours)
      this.envoyerNotifAdmin(`Le joueur ${joueur.prenom} (${emailLower}) a échoué une tentative.`);

      // Afficher la zone bonus si des invitations sont encore possibles (mais le lien n'est PAS affiché)
      this.afficherBonus = true;
      this.majCompteur(emailLower);
    }
  }

  // Envoi d'un email d'invitation **au joueur** contenant le lien (il devra le forwarder à 3 amis)
  envoyerInvitationAuJoueur(emailPlayerLower: string): void {
    const joueur = this.emailsInscrits[emailPlayerLower];
    if (!joueur) return;

    // construire le lien d'invitation (ne PAS l'afficher sur la page)
    const lien = `${environment.baseUrl}?invite=${encodeURIComponent(joueur.token)}`;

    // Préparer params template - adapt to your EmailJS template fields
    const templateParams = {
      to_email: emailPlayerLower,
      prenom: joueur.prenom,
      lien_parrainage: lien,
      message: `Bonjour ${joueur.prenom},\n\nMerci d'avoir joué ! Pour obtenir une seconde chance, 
      veuillez transférer ce message et ce lien d'invitation à 3 amis différents. 
      Quand chacun d'eux s'inscrira via le lien, vous recevrez automatiquement la seconde tentative.\n\nLien (à transférer) : ${lien}`
    };

    // Envoi au joueur
    emailjs.send(
      'service_9od4cf4',
      'template_dj7cys6', // <<--- adapte ce nom à ton template EmailJS
      templateParams,
      '4NHyPfpmCWsVhqyAO'
    )
      .then(() => {
        console.log('Email d\'invitation envoyé au joueur.');
        // marquer qu'une invitation a été envoyée (localStorage) mais on ne révèle pas le lien
        const invitationsEnvoyees = JSON.parse(localStorage.getItem('invitationsEnvoyees') || '{}');
        invitationsEnvoyees[emailPlayerLower] = true;
        localStorage.setItem('invitationsEnvoyees', JSON.stringify(invitationsEnvoyees));
        this.invitationEnvoyee = true;
      })
      .catch((err) => console.error('Erreur EmailJS invitation joueur:', err));

    // notifier admin qu'une invitation a été générée/envoyée
    this.envoyerNotifAdmin(`Une invitation a été générée pour ${joueur.prenom} (${emailPlayerLower}) après échec/temps écoulé.`);
  }

  // Envoit toujours une notification à l'admin (utilisé sur victoire et défaite)
  envoyerNotifAdmin(message: string): void {
    const templateAdminParams = {
      message: message
    };

    emailjs.send(
      'service_9od4cf4',
      'template_jiceud5',   // template admin (existant dans ton code)
      templateAdminParams,
      '4NHyPfpmCWsVhqyAO'
    )
      .then(() => console.log('Notification admin envoyée !'))
      .catch((err) => console.error('Erreur EmailJS admin:', err));
  }

  // L'appel manuel d'inviterAmi n'affiche ni ne copie le lien ; il renvoie simplement l'email d'invitation au joueur (pour qu'il transfère).
  inviterAmi(): void {
    if (!this.joueurActuel) {
      alert('Veuillez vous inscrire avant d’inviter un ami.');
      return;
    }
    const emailLower = this.email.toLowerCase();
    // On garde la logique : si invites >= maxBonus alors plus possible
    const invites = parseInt(localStorage.getItem(emailLower + '_invites') || '0', 10);
    if (invites >= this.maxBonus) {
      alert('❌ Vous avez déjà obtenu les 3 invitations validées. Plus de seconde chance possible.');
      this.afficherBonus = false;
      return;
    }

    // On renvoie au joueur l'email d'invitation pour qu'il le transfère (par ex. s'il l'a supprimé)
    this.envoyerInvitationAuJoueur(emailLower);

    // Message utilisateur en UI (sans afficher le lien)
    this.resultatMessage = '✅ Email d\'invitation (à transférer) renvoyé à votre adresse. Envoyez-le à 3 amis différents pour débloquer la seconde tentative.';
    this.resultColor = 'blue';

    // maj compteur
    this.majCompteur(emailLower);
  }

  startTimer(): void {
    clearInterval(this.timer);
    this.chrono = 40;
    this.afficherChrono = true;
    this.afficherCode = true;
    this.tentativeEnCours = true;

    this.timer = setInterval(() => {
      this.chrono--;
      if (this.chrono <= 0) {
        clearInterval(this.timer);
        this.finChronoOuEchec();
      }
    }, 1000);
  }

  finChronoOuEchec(): void {
    const emailLower = this.email.toLowerCase();
    const joueur = this.emailsInscrits[emailLower];
    if (!joueur) return;

    // Considérer comme tentative utilisée à la fin du chrono
    // si une tentative était encore en cours
    if (this.tentativeEnCours) {
      this.tentativeEnCours = false;
      joueur.tentatives++;
      localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));
    }

    // masquer code et chrono
    this.codeAffiche = '---';
    this.afficherCode = false;
    this.afficherChrono = false;

    this.resultatMessage = '⏰ Temps écoulé ! Un email d\'invitation vous a été envoyé — transférez-le à 3 amis pour rejouer.';
    this.resultColor = 'orange';

    // envoyer l'email d'invitation automatiquement au joueur
    this.envoyerInvitationAuJoueur(emailLower);

    // notifier admin (toujours)
    this.envoyerNotifAdmin(`Le joueur ${joueur.prenom} (${emailLower}) a perdu par temps écoulé.`);

    // afficher zone bonus si encore possible, mais on **ne** montre pas de lien
    this.afficherBonus = true;
    this.majCompteur(emailLower);
  }

  // ================== LIVRAISON ==================
  passerAdresse(): void {
    this.afficherAdresse = true;
    setTimeout(() => document.getElementById('adresseForm')?.scrollIntoView({ behavior: 'smooth' }));
  }

  validerAdresse(): void {
    if (!this.prenom || !this.adresse || !this.ville || !this.codePostal) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    this.envoyerEmail();
    alert(`Merci ${this.prenomLivraison} ! Votre adresse a été enregistrée pour la livraison.`);
    this.afficherAdresse = false;
  }

  envoyerEmail(): void {
    const messageLivraison = `
  Nous vous enverrons un mail de confirmation la veille de votre livraison.  
  L’estimation de la durée de livraison est de 4 à 5 jours ouvrables.  
  👉 Veuillez nous indiquer par courriel le lieu de dépôt souhaité afin de faciliter la remise de votre colis.
`;

    const templateClientParams = {
      to_email: this.email,
      prenom: this.prenom,
      adresse: this.adresse,
      ville: this.ville,
      codePostal: this.codePostal,
      message: messageLivraison
    };

    // 1️⃣ Envoyer au client
    emailjs.send(
      'service_9od4cf4',
      'template_sjokwih',  // template client (existant)
      templateClientParams,
      '4NHyPfpmCWsVhqyAO'
    )
      .then(() => console.log('Email client envoyé !'))
      .catch((err) => console.error('Erreur EmailJS client:', err));

    // 2️⃣ Envoyer à l'admin
    const templateAdminParams = {
      prenom: this.prenom,
      emailClient: this.email,
      adresse: this.adresse,
      ville: this.ville,
      codePostal: this.codePostal,
      message: `Le client ${this.prenom} (${this.email}) a reçu son email de confirmation.`
    };

    emailjs.send(
      'service_9od4cf4',
      'template_jiceud5',   // template admin
      templateAdminParams,
      '4NHyPfpmCWsVhqyAO'
    )
      .then(() => console.log('Notification admin envoyée !'))
      .catch((err) => console.error('Erreur EmailJS admin:', err));
  }

  // ================== PARTAGE ==================
  // NOTE: Ne plus afficher le lien d'invitation sur la page. Les fonctions ci-dessous restent
  // mais n'exposent pas le lien au visiteur. copierLien() ne divulgue rien.
  copierLien(): void {
    alert('Par sécurité, le lien d\'invitation n’est pas affiché sur la page. Un e-mail contenant le lien vous a déjà été envoyé pour le transférer à vos amis.');
  }

  partager(reseau: 'facebook' | 'whatsapp' | 'twitter' | 'instagram'): void {
    alert('Le partage direct du lien d\'invitation n\'est pas disponible depuis la page. Utilisez l\'e-mail reçu pour transférer le lien à vos amis.');
  }

  rejouer(): void {
    // Vérifier si le joueur a droit à une seconde tentative (3 amis validés)
    const emailLower = this.email.toLowerCase();
    const invites = parseInt(localStorage.getItem(emailLower + '_invites') || '0', 10);
    // si invites < maxBonus => accès refusé tant que les 3 amis ne sont pas inscrits
    if (invites < this.maxBonus) {
      this.resultatMessage = `❌ Vous devez avoir 3 amis inscrits via votre lien pour rejouer. (${invites}/${this.maxBonus})`;
      this.resultColor = 'red';
      this.afficherCode = false;
      this.afficherChrono = false;
      this.afficherBonus = true;
      return;
    }

    // si tout est ok, on réinitialise une manche
    this.nouvellePartie();
    this.startTimer();
  }
}
