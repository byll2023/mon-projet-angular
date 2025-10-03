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
  codeAffiche: string = '';            
  reponseSaisie: string = '';            
  chrono: number = 40;
  timer!: ReturnType<typeof setInterval>;
  maxBonus: number = 3;
  compteurBonus: number = 0;
  tentativeEnCours: boolean = false;

  // ================== AFFICHAGE ==================
  afficherCode: boolean = true;
  afficherChrono: boolean = true;

  // ================== PHRASES ==================
  phrases: { texte: string, mot: string }[] = [
 { texte: "On ne peut pas attraper deux *** à la fois", mot: "lièvres" },
  { texte: "Même les montagnes les plus hautes commencent par un ***", mot: "grain" },
  { texte: "Il faut savoir ménager la chèvre et le ***", mot: "chou" },
  { texte: "La curiosité est un vilain ***", mot: "défaut" },
  { texte: "La lumière jaillit là où règne le ***", mot: "silence" },
  { texte: "L’arbre cache souvent la forêt et le *** aussi", mot: "détail" },
  { texte: "Qui sème le vent récolte la ***", mot: "tempête" },
  { texte: "Mieux vaut un mauvais arrangement que un bon ***", mot: "procès" },
  { texte: "Les belles paroles ne font pas le ***", mot: "pain" },
  { texte: "C’est dans l’adversité que l’on découvre le vrai ***", mot: "courage" },
  { texte: "Il n’y a pas de roses sans ***", mot: "épines" },
  { texte: "Tout ce qui brille n’est pas ***", mot: "or" },
  { texte: "Le temps perdu ne se retrouve jamais et les heures perdues ne reviennent jamais et la *** non plus", mot: "jeunesse" },
  { texte: "À force de tirer sur la corde, elle finit par ***", mot: "céder" },
  { texte: "L’appétit vient en mangeant et la curiosité en ***", mot: "regardant" },
  { texte: "Chaque nuage a sa ***", mot: "lueur" },
  { texte: "La parole est d’argent, mais le silence est de ***", mot: "plomb" },
  { texte: "On n’apprend pas à un vieux singe à faire des ***", mot: "grimaces" },
  { texte: "Qui veut voyager loin ménage sa ***", mot: "monture" },
  { texte: "La patience est amère, mais son fruit est ***", mot: "doux" },
  { texte: "Il ne faut pas réveiller le chat qui dort et le *** non plus", mot: "lion" },
  { texte: "Le mensonge a des jambes courtes mais la vérité a des ***", mot: "ailes" },
  { texte: "À bon vin point d’***", mot: "enseigne" },
  { texte: "On n’attrape pas les mouches avec du vinaigre mais avec du ***", mot: "miel" },
  { texte: "Les murs ont des ***", mot: "oreilles" },
  { texte: "Il vaut mieux être seul que mal ***", mot: "accompagné" },
  { texte: "La mer est belle mais elle cache des ***", mot: "courants" },
  { texte: "Les chaînes les plus solides sont celles que l’on ne voit pas et les plus légères celles du ***", mot: "désir" },
  { texte: "On ne fait pas d’omelette sans casser des ***", mot: "œufs" },
  { texte: "À chacun son goût et chacun son ***", mot: "opinion" },
  { texte: "Le savoir est une richesse que l’on ne peut perdre, contrairement à l’***", mot: "argent" },
  { texte: "Qui trotte doucement va loin et qui file trop vite trébuche sur la ***", mot: "racine" },
  { texte: "Le vent se lève, il faut tenter de tenir la ***", mot: "voile" },
  { texte: "Le monde est un théâtre et nous ne sommes que des ***", mot: "acteurs" },
  { texte: "On ne jette pas la pierre quand on a un *** en main", mot: "verre" },
  { texte: "La mémoire est un jardin qu’il faut arroser, sinon il se couvre de ***", mot: "mauvaises herbes" },
  { texte: "L’espoir est le compagnon du courage et le frère de la ***", mot: "patience" },
  { texte: "Les grandes idées naissent souvent dans un esprit ***", mot: "agité" },
  { texte: "Il faut tourner sept fois sa langue dans sa *** avant de parler", mot: "bouche" },
  { texte: "Le cœur a ses raisons que la raison ignore et parfois le *** aussi", mot: "cerveau" },
  { texte: "Le sommeil est le cousin de la ***", mot: "mort" },
  { texte: "L’art de la guerre est celui de la stratégie et celui de la ***", mot: "discrétion" },
  { texte: "Les yeux sont le miroir de l’âme et parfois de la ***", mot: "tristesse" },
  { texte: "On ne peut plaire à tout le monde, surtout aux ***", mot: "mécontents" },
  { texte: "L’argent parle, mais le silence vaut ***", mot: "écoute" },
  { texte: "Le feu purifie tout, même les cœurs les plus ***", mot: "durs" },
  { texte: "On reconnaît l’arbre à ses fruits et l’homme à ses ***", mot: "actes" },
  { texte: "La vérité sort de la bouche des ***", mot: "enfants" },
  { texte: "La chance sourit aux audacieux et fuis les ***", mot: "timides" },
  { texte: "Qui ne risque rien n’a rien et qui reste passif perd sa ***", mot: "chance" }
  ];
  phrasesDejaJouees: Set<number> = new Set();
  phraseActuelle?: { texte: string, mot: string };

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
      this.afficherCode = false;
      this.afficherChrono = false;
      return;
    }

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

    let index: number;
    if (this.phrasesDejaJouees.size >= this.phrases.length) {
      this.phrasesDejaJouees.clear();
    }

    do {
      index = Math.floor(Math.random() * this.phrases.length);
    } while (this.phrasesDejaJouees.has(index));

    this.phraseActuelle = this.phrases[index];
    this.phrasesDejaJouees.add(index);

    this.codeComplet = this.phraseActuelle.mot.toUpperCase();
    this.codeAffiche = this.phraseActuelle.texte;

    this.resultatMessage = '';
    this.reponseSaisie = '';
    this.afficherBonus = false;
    this.tentativeEnCours = true;
  }

  verifierCode(): void {
    if (!this.tentativeEnCours) return;

    const input = this.reponseSaisie.trim().toUpperCase();
    const emailLower = this.email.toLowerCase();
    const joueur = this.joueurActuel;

    if (!joueur) { alert('Veuillez vous inscrire avant de jouer.'); return; }

    this.tentativeEnCours = false;
    joueur.tentatives++;
    localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));

    clearInterval(this.timer);

    if (input === this.codeComplet) {
      this.resultatMessage = '🎉 Bravo ! Vous avez trouvé le mot manquant 🎯';
      this.resultColor = 'green';
      this.victoire = true;
      this.invitationEnvoyee = true;
      this.notifierAdmin(`Le joueur ${joueur.prenom} (${emailLower}) a gagné le jeu.`);
      setTimeout(() => document.getElementById('btnContinuer')?.scrollIntoView({ behavior: 'smooth' }), 300);
    } else {
      this.resultatMessage = `❌ Mauvais choix... Le mot était "${this.codeComplet}".`;
      this.resultColor = 'red';
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

    emailjs.send('service_9od4cf4', 'template_dj7cys6', templateParams, '4NHyPfpmCWsVhqyAO')
      .then(() => {
        console.log('Email d\'invitation envoyé au joueur.');
        const invitationsEnvoyees = JSON.parse(localStorage.getItem('invitationsEnvoyees') || '{}');
        invitationsEnvoyees[emailPlayerLower] = true;
        localStorage.setItem('invitationsEnvoyees', JSON.stringify(invitationsEnvoyees));
        this.resultatMessage = `📧 Invitation envoyée à ${joueur.prenom} (${emailPlayerLower}) !`;
        this.resultColor = 'green';
      })
      .catch((err: any) => console.error('Erreur EmailJS invitation joueur:', err));
  }

  private notifierAdmin(message: string, type: 'jeu' | 'invitation' | 'livraison' = 'jeu'): void {
    emailjs.send('service_9od4cf4', 'template_jiceud5', { message }, '4NHyPfpmCWsVhqyAO')
      .catch((err: any) => console.error('Erreur EmailJS admin:', err));
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
    clearInterval(this.timer);
    const emailLower = this.email.toLowerCase();
    const joueur = this.emailsInscrits[emailLower];
    if (!joueur) return;

    if (this.tentativeEnCours) {
      this.tentativeEnCours = false;
      joueur.tentatives++;
      localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));
    }

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

    emailjs.send('service_9od4cf4', 'template_sjokwih', {
      to_email: this.email,
      prenom: this.prenom,
      adresse: this.adresse,
      ville: this.ville,
      codePostal: this.codePostal,
      message: messageLivraison
    }, '4NHyPfpmCWsVhqyAO')
      .catch((err: any) => console.error('Erreur EmailJS client:', err));

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
