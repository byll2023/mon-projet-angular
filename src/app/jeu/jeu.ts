import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import emailjs from '@emailjs/browser';
import { InvitationService, JoueurFirestore } from '../services/invitation.service';
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
  chrono: number = 30;
  timer!: ReturnType<typeof setInterval>;
  maxBonus: number = 3;
  compteurBonus: number = 0;
  tentativeEnCours: boolean = false;

  // ================== AFFICHAGE ==================
  afficherCode: boolean = true;
  afficherChrono: boolean = true;

  // ================== PHRASES ==================
  phrases: { texte: string, mot: string }[] = [
    { texte: "On ne peut pas attraper deux *** à la fois", mot: "proies" },
    { texte: "Même les montagnes les plus hautes commencent par un ***", mot: "pas" },
    { texte: "Il faut savoir ménager la chèvre et le ***", mot: "loup" },
    { texte: "La curiosité est un vilain ***", mot: "travers" },
    { texte: "La lumière jaillit là où règne le ***", mot: "calme" },
    { texte: "L’arbre cache souvent la forêt et le *** aussi", mot: "détail" },
    { texte: "Qui sème le vent récolte la ***", mot: "tourmente" },
    { texte: "Mieux vaut un mauvais arrangement qu’un bon ***", mot: "procès" },
    { texte: "Les belles paroles ne font pas le ***", mot: "repas" },
    { texte: "C’est dans l’adversité que l’on découvre le vrai ***", mot: "courage" },
    { texte: "Il n’y a pas de roses sans ***", mot: "piquants" },
    { texte: "Tout ce qui brille n’est pas ***", mot: "diamant" },
    { texte: "Le temps perdu ne se retrouve jamais et la *** non plus", mot: "jeunesse" },
    { texte: "À force de tirer sur la corde, elle finit par se ***", mot: "briser" },
    { texte: "L’appétit vient en mangeant et la curiosité en ***", mot: "observant" },
    { texte: "Chaque nuage a sa ***", mot: "clarté" },
    { texte: "La parole est d’argent, mais le silence est de ***", mot: "sagesse" },
    { texte: "On n’apprend pas à un vieux singe à faire des ***", mot: "tours" },
    { texte: "Qui veut voyager loin ménage sa ***", mot: "force" },
    { texte: "La patience est amère, mais son fruit est ***", mot: "mielleux" },
    { texte: "Il ne faut pas réveiller le chat qui dort et le *** non plus", mot: "tigre" },
    { texte: "Le mensonge a des jambes courtes mais la vérité a des ***", mot: "ailes" },
    { texte: "À bon vin point d’***", mot: "enseigne" },
    { texte: "On attire plus les mouches avec du *** qu’avec du vinaigre", mot: "nectar" },
    { texte: "Les murs ont des ***", mot: "oreilles" },
    { texte: "Il vaut mieux être seul que mal ***", mot: "entouré" },
    { texte: "La mer est belle mais elle cache des ***", mot: "abîmes" },
    { texte: "Les chaînes les plus solides sont celles qu’on ne voit pas et les plus légères celles du ***", mot: "désir" },
    { texte: "On ne fait pas d’omelette sans casser des ***", mot: "coquilles" },
    { texte: "À chacun son goût et chacun son ***", mot: "avis" },
    { texte: "Le savoir est une richesse que l’on ne peut perdre, contrairement à la***", mot: "monnaie" },
    { texte: "Qui trotte doucement va loin et qui file trop vite trébuche sur la ***", mot: "pierre" },
    { texte: "Le vent se lève, il faut tenter de tenir la ***", mot: "cap" },
    { texte: "Le monde est un théâtre et nous ne sommes que des ***", mot: "rôles" },
    { texte: "On ne jette pas la pierre quand on a un *** en main", mot: "miroir" },
    { texte: "La mémoire est un jardin qu’il faut arroser, sinon il se couvre de ***", mot: "ronces" },
    { texte: "L’espoir est le compagnon du courage et le frère de la ***", mot: "ténacité" },
    { texte: "Les grandes idées naissent dans un esprit ***", mot: "ingénieux" },
    { texte: "Il faut tourner sept fois sa langue dans son *** avant de parler", mot: "palais" },
    { texte: "Le cœur a ses raisons que la raison ignore et parfois le *** aussi", mot: "corps" },
    { texte: "L’art de la guerre est celui de la stratégie et celui de la ***", mot: "ruse" },
    { texte: "On ne peut plaire à tout le monde, surtout aux ***", mot: "critiques" },
    { texte: "L’argent parle, mais le silence vaut ***", mot: "saphir" },
    { texte: "Le feu purifie tout, même les cœurs les plus ***", mot: "froids" },
    { texte: "On reconnaît l’arbre à ses fruits et l’homme à ses ***", mot: "réalisations" },
    { texte: "La vérité sort de la bouche des ***", mot: "enfants" },
    { texte: "La chance sourit aux audacieux et fuit les ***", mot: "peureux" },
    { texte: "Qui ne risque rien n’a rien et qui reste passif perd son ***", mot: "occasion" }
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

  constructor(private invitationService: InvitationService) { }

  // ================== INIT ==================

  ngOnInit(): void {
    this.emailsInscrits = JSON.parse(localStorage.getItem('emailsJeu') || '{}');

    const urlParams = new URLSearchParams(window.location.search);
    const tokenInvite = urlParams.get('invite');
    const registeringEmail = urlParams.get('registerEmail');

    if (tokenInvite) {
      // On stocke le token en attente (court délai possible si tu veux)
      localStorage.setItem('pendingInviteToken', tokenInvite);
      localStorage.setItem('pendingInviteToken_ts', Date.now().toString());

      // Si le lien contient déjà registerEmail, on peut traiter tout de suite
      if (registeringEmail) {
        this.processPendingInviteFor(registeringEmail.toLowerCase());
      }
    }
  }
  
  
 
  /**
   * Traite un token d'invitation stocké en localStorage pour l'email qui vient de s'inscrire.
   * - évite les doublons
   * - plafonne à this.maxBonus
   * - supprime le token "pending" après traitement
   */
  private processPendingInviteFor(registeringEmail: string): void {
    const token = localStorage.getItem('pendingInviteToken');
    if (!token) return;

    const regLower = registeringEmail.toLowerCase();

    // trouver l'email de l'invitant (les clés de emailsInscrits sont déjà en lower-case)
    const inviterEmail = Object.keys(this.emailsInscrits).find(k => {
      return this.emailsInscrits[k] && this.emailsInscrits[k].token === token;
    });

    // pas d'auto-invitation
    if (!inviterEmail || inviterEmail === regLower) {
      localStorage.removeItem('pendingInviteToken');
      localStorage.removeItem('pendingInviteToken_ts');
      return;
    }

    const keyFriends = inviterEmail + '_friends';
    const friendsList: string[] = JSON.parse(localStorage.getItem(keyFriends) || '[]');

    if (!friendsList.includes(regLower)) {
      friendsList.push(regLower);
      localStorage.setItem(keyFriends, JSON.stringify(friendsList));

      const invites = parseInt(localStorage.getItem(inviterEmail + '_invites') || '0', 10);
      const newInvites = Math.min(invites + 1, this.maxBonus);
      localStorage.setItem(inviterEmail + '_invites', newInvites.toString());
    }

    // nettoie le token en attente pour éviter double comptage
    localStorage.removeItem('pendingInviteToken');
    localStorage.removeItem('pendingInviteToken_ts');
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

async inscription(): Promise<void> {
  const emailLower = this.email.toLowerCase();
  const token = btoa(emailLower + Date.now());

  const joueur: JoueurFirestore = {
    email: emailLower,
    prenom: this.prenom || 'Participant',
    token,
    amis: [],
    tentatives: 0
  };

  // Sauvegarde dans Firebase via ton service
  await this.invitationService.sauvegarderJoueur(joueur);

  // Optionnel : sauvegarde locale pour compatibilité existante
  this.emailsInscrits[emailLower] = { prenom: joueur.prenom, token: joueur.token, tentatives: joueur.tentatives };
  localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));
  if (!localStorage.getItem(emailLower + '_invites')) localStorage.setItem(emailLower + '_invites', '0');
  if (!localStorage.getItem(emailLower + '_friends')) localStorage.setItem(emailLower + '_friends', JSON.stringify([]));

  this.processPendingInviteFor(emailLower);

  this.joueurActuel = joueur;
  this.majCompteur(emailLower);

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
    // REMPLACEMENT: créer un trait long de la même longueur que le mot
    const traitLong = '_'.repeat(this.phraseActuelle.mot.length);
    this.codeAffiche = this.phraseActuelle.texte.replace(/\*+/g, traitLong);

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
    this.chrono = 30;
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
    if (!this.joueurActuel) {
      alert('Veuillez vous inscrire avant de copier le lien.');
      return;
    }

    const lien = `${environment.baseUrl}?invite=${encodeURIComponent(this.joueurActuel.token)}`;

    navigator.clipboard.writeText(lien)
      .then(() => {
        this.resultatMessage = '✅ Lien copié dans le presse-papier !';
        this.resultColor = 'green';
      })
      .catch(() => alert('❌ Impossible de copier le lien.'));
  }

  partager(reseau: 'facebook' | 'whatsapp' | 'twitter' | 'instagram'): void {
    if (!this.joueurActuel) {
      alert('Veuillez vous inscrire avant de partager.');
      return;
    }

    const lien = `${environment.baseUrl}?invite=${encodeURIComponent(this.joueurActuel.token)}`;
    let url = '';

    switch (reseau) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(lien)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(lien)}&text=${encodeURIComponent("Viens jouer avec moi 🎯")}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent("Rejoins-moi au jeu 🎉 " + lien)}`;
        break;
      case 'instagram':
        alert('📌 Instagram ne supporte pas le partage direct par URL. Copiez le lien et collez-le dans votre bio ou vos messages privés.');
        return;
    }

    if (url) window.open(url, '_blank');
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
} // 👈 très important : cette accolade ferme la classe JeuComponent