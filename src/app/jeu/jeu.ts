import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Joueur {
  prenom: string;
  token: string;
  bonus: number;
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
  imports: [CommonModule, FormsModule], // ✅ Important pour les directives Angular dans le template
  templateUrl: './jeu.html',
  styleUrls: ['./jeu.css']
})
export class JeuComponent implements OnInit {

  codeComplet: string = '';
  indexManquant: number = 0;
  lettreCorrecte: string = '';
  codeAffiche: string = '---';
  lettreSaisie: string = '';
  chrono: number = 30;
  timer: any;
  maxBonus: number = 3;

  prenom: string = '';
  email: string = '';
  accepterNewsletter: boolean = false;
  emailsInscrits: { [key: string]: Joueur } = {};

  afficherInscription: boolean = false;
  afficherJeu: boolean = false;
  afficherBonus: boolean = false;
  bonusDisponible: boolean = true;
  compteurBonus: number = 0;
  resultatMessage: string = '';
  resultColor: string = 'black';
  lienParrainage: string = '';

  avisGagnants: Avis[] = [
    { image: 'images/gagnant1.jpg', message: 'Super confortables, j’adore !', nom: 'Marie', ville: 'Montréal' },
    { image: 'images/gagnant2.jpg', message: 'Je ne m’attendais pas à gagner, merci Ferargile 🎉', nom: 'Karim', ville: 'Québec' },
    { image: 'images/gagnant3.jpg', message: 'Chaussettes douces et chaudes, parfaites pour l’hiver.', nom: 'Sophie', ville: 'Laval' },
  ];

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

  afficherFormulaire(): void {
    this.afficherInscription = true;
    setTimeout(() => document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth' }));
  }

  inscription(): void {
    const emailLower = this.email.toLowerCase();
    if (this.emailsInscrits[emailLower]) {
      alert('Vous avez déjà participé au jeu avec cet email !');
      return;
    }
    const token = btoa(emailLower + Date.now());
    this.emailsInscrits[emailLower] = { prenom: this.prenom, token, bonus: 0 };
    localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));

    this.majCompteur(emailLower);
    alert("Merci pour votre inscription ! Le jeu commence maintenant.");

    this.afficherJeu = true;
    setTimeout(() => document.getElementById('jeuSection')?.scrollIntoView({ behavior: 'smooth' }));

    this.nouvellePartie();
    this.startTimer();
  }

  majCompteur(email: string): void {
    const joueur = this.emailsInscrits[email];
    const restant = this.maxBonus - joueur.bonus;
    this.compteurBonus = restant >= 0 ? restant : 0;
  }

  genererCode(longueur: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < longueur; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  nouvellePartie(): void {
    this.codeComplet = this.genererCode();
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
  }

  verifierCode(): void {
    const input = this.lettreSaisie.toUpperCase();
    if (input === this.lettreCorrecte) {
      clearInterval(this.timer);
      this.resultatMessage = '🎉 Félicitations ! Vous avez gagné vos chaussettes Ferargile !';
      this.resultColor = 'green';
      this.afficherBonus = false;
    } else {
      this.resultatMessage = '❌ Mauvais choix... retentez votre chance !';
      this.resultColor = 'red';
    }
  }

  startTimer(): void {
    clearInterval(this.timer);
    this.chrono = 30;
    this.resultatMessage = `Temps restant : ${this.chrono}s`;
    this.resultColor = 'black';

    this.timer = setInterval(() => {
      this.chrono--;
      if (this.chrono <= 0) {
        clearInterval(this.timer);
        this.finChronoOuEchec();
      } else {
        this.resultatMessage = `Temps restant : ${this.chrono}s`;
      }
    }, 1000);
  }

  finChronoOuEchec(): void {
    const emailLower = this.email.toLowerCase();
    const joueur = this.emailsInscrits[emailLower];

    this.codeAffiche = '---';
    this.lettreSaisie = '';
    this.resultatMessage = '⏰ Temps écoulé ! Pas cette fois ! Retentez votre chance en invitant un ami.';
    this.resultColor = 'orange';

    this.afficherBonus = true;
    this.bonusDisponible = joueur.bonus < this.maxBonus;

    if (this.bonusDisponible) {
      this.lienParrainage = `${window.location.href.split('?')[0]}?invite=${joueur.token}`;
    }

    this.majCompteur(emailLower);
  }

  copierLien(): void {
    navigator.clipboard.writeText(this.lienParrainage)
      .then(() => alert('Lien copié ! Partagez-le avec vos amis.'));
  }

  partager(reseau: 'facebook' | 'whatsapp' | 'twitter'): void {
    const url = encodeURIComponent(window.location.href);
    const message = encodeURIComponent(`🎉 J’ai gagné mes chaussettes Ferargile ! Viens tenter ta chance 👉 ${window.location.href}`);

    if (reseau === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    } else if (reseau === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
    } else if (reseau === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${message}`, '_blank');
    }
  }
}

