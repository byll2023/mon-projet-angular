import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import emailjs from '@emailjs/browser';

interface Joueur {
  prenom: string;
  token: string;
  bonus: number;
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
  maxBonus: number = 3;
  lettresGagnantes: string[] = ['A', 'B', 'C', 'D', 'E'];

  // Joueur inscription
  prenom: string = '';
  email: string = '';
  accepterNewsletter: boolean = false;

  // Adresse livraison
  prenomLivraison: string = '';
  adresse: string = '';
  ville: string = '';
  codePostal: string = '';

  // Emails déjà inscrits
  emailsInscrits: { [key: string]: Joueur } = {};

  // Affichage
  afficherInscription: boolean = false;
  afficherJeu: boolean = false;
  afficherBonus: boolean = false;
  bonusDisponible: boolean = true;
  afficherAdresse: boolean = false;
  compteurBonus: number = 0;
  resultatMessage: string = '';
  resultColor: string = 'black';
  lienParrainage: string = '';

  avisGagnants: Avis[] = [
    { image: 'assets/images/gagnant1.jpg', message: 'Super confortables, j’adore !', nom: 'Marie', ville: 'Montréal' },
    { image: 'assets/images/gagnant2.jpg', message: 'Merci Ferargile 🎉 je suis trop content !', nom: 'Karim', ville: 'Québec' },
    { image: 'assets/images/gagnant3.jpg', message: 'Chaussettes douces et chaudes, parfaites pour l’hiver.', nom: 'Sophie', ville: 'Laval' },
  ];

  // ================= INIT =================
  ngOnInit(): void {
    this.emailsInscrits = JSON.parse(localStorage.getItem('emailsJeu') || '{}');

    const urlParams = new URLSearchParams(window.location.search);
    const tokenInvite = urlParams.get('invite');

    if (tokenInvite) {
      for (let mail in this.emailsInscrits) {
        const joueur = this.emailsInscrits[mail];
        if (joueur.token === tokenInvite && joueur.bonus < this.maxBonus) {
          joueur.bonus++;
          localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));
          this.majCompteur(mail);
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
    const joueur = this.emailsInscrits[emailLower];

    if (joueur && joueur.tentatives >= 20) {
      alert('Vous avez atteint le maximum de tentatives.');
      return;
    }

    if (!joueur) {
      const token = btoa(emailLower + Date.now());
      this.emailsInscrits[emailLower] = { prenom: this.prenom, token, bonus: 0, tentatives: 0 };
      localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));
    }

    this.majCompteur(emailLower);
    this.afficherJeu = true;
    this.nouvellePartie();
    this.startTimer();

    setTimeout(() => document.getElementById('jeuSection')?.scrollIntoView({ behavior: 'smooth' }));
  }

  majCompteur(email: string): void {
    const joueur = this.emailsInscrits[email];
    const restant = this.maxBonus - joueur.bonus;
    this.compteurBonus = restant >= 0 ? restant : 0;
  }

  // ================== LOGIQUE DU JEU ==================
  genererCode(longueur: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: longueur }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }

  nouvellePartie(): void {
    this.codeComplet = this.genererCode();
    let codeArray = this.codeComplet.split('');

    do {
      this.indexManquant = Math.floor(Math.random() * codeArray.length);
    } while (!isNaN(Number(codeArray[this.indexManquant])));

    this.lettreCorrecte = this.lettresGagnantes[Math.floor(Math.random() * this.lettresGagnantes.length)];
    codeArray[this.indexManquant] = '_';
    this.codeAffiche = codeArray.join(' ');

    this.resultatMessage = '';
    this.lettreSaisie = '';
    this.afficherBonus = false;
  }

  verifierCode(): void {
    const input = this.lettreSaisie.toUpperCase();
    const emailLower = this.email.toLowerCase();
    const joueur = this.emailsInscrits[emailLower];

    joueur.tentatives++;
    localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));

    if (input === this.lettreCorrecte) {
      clearInterval(this.timer);
      this.resultatMessage = '🎉 Félicitations ! Vous avez gagné vos chaussettes Ferargile !';
      this.resultColor = 'green';
      this.afficherAdresse = true;
    } else {
      if (joueur.tentatives >= 20) {
        this.resultatMessage = '❌ Vous avez atteint le maximum de tentatives !';
        this.codeAffiche = '---';
        this.afficherBonus = true;
      } else {
        this.resultatMessage = '❌ Mauvais choix... retentez votre chance !';
      }
      this.resultColor = 'red';
    }
  }

  startTimer(): void {
    clearInterval(this.timer);
    this.chrono = 40;

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

    this.codeAffiche = '---';
    this.resultatMessage = '⏰ Temps écoulé ! Invitez un ami pour rejouer.';
    this.resultColor = 'orange';

    this.afficherBonus = true;
    this.bonusDisponible = joueur.bonus < this.maxBonus;
    if (this.bonusDisponible) {
      this.lienParrainage = `${window.location.href.split('?')[0]}?invite=${joueur.token}`;
    }
    this.majCompteur(emailLower);
  }

  // ================== LIVRAISON ==================
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
🎉 Félicitations ${this.prenom}, vous avez remporté notre jeu concours Ferargile !

Votre cadeau sera envoyé à :
${this.prenom}, ${this.adresse}, ${this.ville}, ${this.codePostal}

Livraison estimée : 7 à 10 jours ouvrables.

👉 À la veille du lancement officiel de notre boutique en ligne ferargile.com, recevez un code promo unique de -10% dès 60$.

Merci d'avoir participé et à très vite,
L'équipe Ferargile 🧦
`;

    const templateParams = {
      to_email: this.email,
      prenom: this.prenom,
      adresse: this.adresse,
      ville: this.ville,
      codePostal: this.codePostal,
      message: messageLivraison
    };

    emailjs.send(
      'service_9od4cf4',
      'template_i6kkf43',
      templateParams,
      '4NHyPfpmCWsVhqyAO'
    )
      .then(() => console.log('Email envoyé !'))
      .catch((err) => console.error('Erreur EmailJS:', err));
  }

  // ================== PARTAGE ==================
  copierLien(): void {
    navigator.clipboard.writeText(this.lienParrainage)
      .then(() => alert('Lien copié ! Partagez-le avec vos amis.'));
  }

  partager(reseau: 'facebook' | 'whatsapp' | 'twitter' | 'instagram'): void {
    const url = encodeURIComponent(window.location.href);
    const message = encodeURIComponent(`🎉 J’ai gagné mes chaussettes Ferargile ! Viens tenter ta chance 👉 ${window.location.href}`);

    if (reseau === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    } else if (reseau === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
    } else if (reseau === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${message}`, '_blank');
    } else if (reseau === 'instagram') {
      alert('Instagram ne permet pas de partage direct, copiez le lien manuellement.');
    }
  }

  rejouer(): void {
    this.nouvellePartie();
    this.startTimer();
  }
}
