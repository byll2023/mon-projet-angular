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

  // ================== VARIABLES JEU ==================
  codeComplet: string = '';
  indexManquant: number = 0;
  lettreCorrecte: string = '';
  codeAffiche: string = '---';
  lettreSaisie: string = '';
  chrono: number = 40;
  timer!: ReturnType<typeof setInterval>;
  maxBonus: number = 3;
  compteurBonus: number = 0;
  tentativeEnCours: boolean = false;
  // lettresGagnantes: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // ================== NOUVEAU : MOTS DIFFICILES ==================
  motsDifficiles: string[] = [
    "hippopotomonstrosesquippedaliophobie",
    "anticonstitutionnellement",
    "sphygmomanomètre",
    "xylophone",
    "pneumonoultramicroscopicsilicovolcanoconiose",
    "chrysanthemum",
    "triskaïdekaphobie",
    "procrastination",
    "rhombicosidodécaèdre",
    "substantiellement"
  ];

  // ================== VARIABLES JOUEUR ==================
  prenom: string = '';
  email: string = '';
  accepterNewsletter: boolean = false;
  joueurActuel?: Joueur;
  invitationEnvoyee: boolean = false;

  // ================== VARIABLES LIVRAISON ==================
  adresse: string = '';
  ville: string = '';
  codePostal: string = '';
  afficherAdresse: boolean = false;

  // ================== AFFICHAGE ==================
  afficherInscription: boolean = false;
  afficherJeu: boolean = false;
  afficherBonus: boolean = false;
  bonusDisponible: boolean = true;
  resultatMessage: string = '';
  resultColor: string = 'black';
  afficherCode: boolean = true;
  afficherChrono: boolean = true;
  victoire: boolean = false; 


  // ================== STOCKAGE LOCAL ==================
  emailsInscrits: { [key: string]: Joueur } = {};
  avisGagnants: Avis[] = [
    { image: 'assets/images/gagnant1.jpg', message: 'Super confortables, j’adore !', nom: 'Marie', ville: 'Montréal' },
    { image: 'assets/images/gagnant2.jpg', message: 'Merci Ferargile 🎉 je suis trop content !', nom: 'Karim', ville: 'Québec' },
    { image: 'assets/images/gagnant3.jpg', message: 'Chaussettes douces et chaudes, parfaites pour l’hiver.', nom: 'Sophie', ville: 'Laval' },
  ];

  // ================== INIT ==================
  ngOnInit(): void {
    this.emailsInscrits = JSON.parse(localStorage.getItem('emailsJeu') || '{}');

    const urlParams = new URLSearchParams(window.location.search);
    const tokenInvite = urlParams.get('invite');

    if (tokenInvite) {
      for (let mail in this.emailsInscrits) {
        const joueur = this.emailsInscrits[mail];
        if (!joueur) continue;

        if (joueur.token === tokenInvite) {
          const registeringEmail = urlParams.get('registerEmail');
          if (registeringEmail && registeringEmail.toLowerCase() !== mail) {
            const keyFriends = mail + '_friends';
            const friendsList: string[] = JSON.parse(localStorage.getItem(keyFriends) || '[]');

            if (!friendsList.includes(registeringEmail.toLowerCase()) && this.emailsInscrits[registeringEmail.toLowerCase()]) {
              friendsList.push(registeringEmail.toLowerCase());
              localStorage.setItem(keyFriends, JSON.stringify(friendsList));

              const invites = parseInt(localStorage.getItem(mail + '_invites') || '0', 10);
              if (invites < this.maxBonus) {
                localStorage.setItem(mail + '_invites', (invites + 1).toString());
              }
            }
          }
          break;
        }
      }
    }
  }

  // ================== GETTERS ==================
  get invites(): number {
    const emailLower = this.email.toLowerCase();
    return parseInt(localStorage.getItem(emailLower + '_invites') || '0', 10);
  }
  // ✅ Nouveau getter pour le bouton Continuer
  get afficherBoutonContinuer(): boolean {
  return this.victoire && !this.afficherAdresse;
}



  // ================== INSCRIPTION ==================
  afficherFormulaire(): void {
    this.afficherInscription = true;
    setTimeout(() => document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth' }));
  }

  inscription(): void {
    const emailLower = this.email.toLowerCase();
    let joueur = this.emailsInscrits[emailLower];

    if (!joueur) {
      const token = btoa(emailLower + Date.now());
      this.emailsInscrits[emailLower] = { prenom: this.prenom || 'Participant', token, tentatives: 0 };
      joueur = this.emailsInscrits[emailLower];
      localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));
      if (!localStorage.getItem(emailLower + '_invites')) localStorage.setItem(emailLower + '_invites', '0');
      if (!localStorage.getItem(emailLower + '_friends')) localStorage.setItem(emailLower + '_friends', JSON.stringify([]));
    }

    this.joueurActuel = joueur;
    this.majCompteur(emailLower);

    if (joueur.tentatives >= 1 && this.compteurBonus > 0) {
      this.resultatMessage = `❌ Maximum de tentatives atteint ! Invitez 3 amis pour rejouer (${this.maxBonus - this.compteurBonus}/${this.maxBonus}).`;
      this.resultColor = 'red';
      this.afficherBonus = true;
      this.afficherJeu = true;

      // ❌ Ne pas afficher le bouton continuer ni le scroll
      this.afficherCode = false;
      this.afficherChrono = false;
      return;
    }
    // === Sinon, début de partie normale ===
    this.afficherJeu = true;
    this.nouvellePartie();
    this.startTimer();
    setTimeout(() => document.getElementById('jeuSection')?.scrollIntoView({ behavior: 'smooth' }));
  }

  majCompteur(email: string): void {
    const invites = parseInt(localStorage.getItem(email + '_invites') || '0', 10);
    const restant = this.maxBonus - invites;
    this.compteurBonus = restant >= 0 ? restant : 0;
    this.bonusDisponible = invites < this.maxBonus;
  }

  // ================== JEU ==================

  nouvellePartie(): void {
    this.afficherCode = true;
    this.afficherChrono = true;

    // Ici tu peux décider d'utiliser un mot difficile plutôt qu'un code aléatoire
    this.codeComplet = this.motsDifficiles[Math.floor(Math.random() * this.motsDifficiles.length)].toUpperCase();

    let codeArray = this.codeComplet.split('');

    do {
      this.indexManquant = Math.floor(Math.random() * codeArray.length);
    } while (!isNaN(Number(codeArray[this.indexManquant])));

    this.lettreCorrecte = codeArray[this.indexManquant];
    codeArray[this.indexManquant] = '_';
    this.codeAffiche = codeArray.join(' ');

    this.resultatMessage = '';
    this.lettreSaisie = '';
    this.afficherBonus = false;
    this.tentativeEnCours = true;
  }

  verifierCode(): void {
    if (!this.tentativeEnCours) return;

    const input = this.lettreSaisie.toUpperCase();
    const emailLower = this.email.toLowerCase();
    const joueur = this.joueurActuel;

    if (!joueur) { alert('Veuillez vous inscrire avant de jouer.'); return; }

    this.tentativeEnCours = false;
    joueur.tentatives++;
    localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));

    clearInterval(this.timer); // ✅ Stop chrono


    if (input === this.lettreCorrecte) {
      // clearInterval(this.timer);
      this.resultatMessage = '🎉 Félicitations ! Vous avez trouvé la bonne lettre 🎯';
      this.resultColor = 'green';
      this.afficherCode = false;
      this.afficherChrono = false;
      // ✅ Seul ici on active le bouton continuer
      // this.boutonContinuer = true;
       this.victoire = true; // ✅ Victoire confirmée
      this.invitationEnvoyee = true;
      this.notifierAdmin(`Le joueur ${joueur.prenom} (${emailLower}) a gagné le jeu.`);
      setTimeout(() => document.getElementById('btnContinuer')?.scrollIntoView({ behavior: 'smooth' }), 300);
    } else {
      this.resultatMessage = `❌ Mauvais choix... La bonne lettre était "${this.lettreCorrecte}".\nLe mot était : ${this.codeComplet}`;
      this.resultColor = 'red';
      this.codeAffiche = this.codeComplet.split('').join(' ')
      this.afficherChrono = false;
      this.ajouterInvitation(emailLower);
      this.majCompteur(emailLower);
    }
  }

  // ================== INVITATIONS & ADMIN ==================
  inviterAmi(): void {
    if (!this.joueurActuel) return;
    this.ajouterInvitation(this.email.toLowerCase());
  }

  private ajouterInvitation(emailPlayerLower: string, messagePersonnalise?: string): void {
    const joueur = this.emailsInscrits[emailPlayerLower];
    if (!joueur) return;

    const lien = `${environment.baseUrl}?invite=${encodeURIComponent(joueur.token)}`;
    const templateParams = {
      to_email: emailPlayerLower,
      prenom: joueur.prenom,
      lien_parrainage: lien,
      message: messagePersonnalise || `Bonjour ${joueur.prenom},\n\nMerci d'avoir joué ! Transférez ce lien à 3 amis pour obtenir une seconde chance.\n\nLien : ${lien}`
    };
    // ✅ Email au joueur
    emailjs.send('service_9od4cf4', 'template_dj7cys6', templateParams, '4NHyPfpmCWsVhqyAO')
      .then(() => {
        console.log('Email d\'invitation envoyé au joueur.');
        const invitationsEnvoyees = JSON.parse(localStorage.getItem('invitationsEnvoyees') || '{}');
        invitationsEnvoyees[emailPlayerLower] = true;
        localStorage.setItem('invitationsEnvoyees', JSON.stringify(invitationsEnvoyees));
        // this.invitationEnvoyee = true;
        // ✅ Affichage message utilisateur
        this.resultatMessage = `📧 Invitation envoyée à ${joueur.prenom} (${emailPlayerLower}) !`;
        this.resultColor = 'green';
      })
      .catch(err => console.error('Erreur EmailJS invitation joueur:', err));
    // ✅ Email admin séparé
    // this.notifierAdmin(`Une invitation a été générée pour ${joueur.prenom} (${emailPlayerLower}).`, 'invitation');
  }

  private notifierAdmin(message: string, type: 'jeu' | 'invitation' | 'livraison' = 'jeu'): void {
    emailjs.send('service_9od4cf4', 'template_jiceud5', { message }, '4NHyPfpmCWsVhqyAO')
      .then(() => console.log(`Notification admin (${type}) envoyée !`))
      .catch(err => console.error('Erreur EmailJS admin:', err));
  }

  // ================== TIMER ==================
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
    clearInterval(this.timer); // ✅ Stop chrono
    const emailLower = this.email.toLowerCase();
    const joueur = this.emailsInscrits[emailLower];
    if (!joueur) return;

    if (this.tentativeEnCours) {
      this.tentativeEnCours = false;
      joueur.tentatives++;
      localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));
    }

    this.codeAffiche = '---';
    this.afficherCode = false;
    this.afficherChrono = false;
    this.resultatMessage = `⏰ Temps écoulé ! Le mot était : ${this.codeComplet}`;
    this.resultColor = 'orange';

    this.ajouterInvitation(emailLower);
    this.majCompteur(emailLower);
    this.notifierAdmin(`Le joueur ${joueur.prenom} (${emailLower}) a perdu par temps écoulé.`, 'jeu');
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
    alert(`Merci ${this.prenom} ! Votre adresse a été enregistrée pour la livraison.`);
    this.afficherAdresse = false;
  }

  envoyerEmail(): void {
    const messageLivraison = `
      Nous vous enverrons un mail de confirmation la veille de votre livraison.
      L’estimation de la durée de livraison est de 4 à 5 jours ouvrables.
      👉 Veuillez nous indiquer par courriel le lieu de dépôt souhaité.
    `;

    // Email client
    emailjs.send('service_9od4cf4', 'template_sjokwih', {
      to_email: this.email,
      prenom: this.prenom,
      adresse: this.adresse,
      ville: this.ville,
      codePostal: this.codePostal,
      message: messageLivraison
    }, '4NHyPfpmCWsVhqyAO')
      .then(() => console.log('Email client envoyé !'))
      .catch(err => console.error('Erreur EmailJS client:', err));

    // Email admin
    this.notifierAdmin(`Le client ${this.prenom} (${this.email}) a reçu son email de confirmation.`, 'livraison');
  }

  // ================== PARTAGE ==================
  copierLien(): void {
    alert('Le lien d\'invitation n’est pas affiché. Utilisez l’email reçu.');
  }

  partager(reseau: 'facebook' | 'whatsapp' | 'twitter' | 'instagram'): void {
    alert('Partage direct indisponible. Utilisez l’email reçu.');
  }

  rejouer(): void {
    const emailLower = this.email.toLowerCase();
    const invites = parseInt(localStorage.getItem(emailLower + '_invites') || '0', 10);
    if (invites < this.maxBonus) {
      this.resultatMessage = `❌ Vous devez avoir 3 amis inscrits via votre lien pour rejouer. (${invites}/${this.maxBonus})`;
      this.resultColor = 'red';
      this.afficherCode = false;
      this.afficherChrono = false;
      this.afficherBonus = true;
      return;
    }
    this.nouvellePartie();
    this.startTimer();
  }
}
