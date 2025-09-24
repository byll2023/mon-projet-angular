import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import emailjs from '@emailjs/browser';

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
  maxBonus: number = 3; // utilisé comme nombre max d'invitations
  lettresGagnantes: string[] = ['X', 'D', 'F', 'Y', 'U'];

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

  // Affichage
  afficherInscription: boolean = false;
  afficherJeu: boolean = false;
  afficherBonus: boolean = false;
  bonusDisponible: boolean = true;
  afficherAdresse: boolean = false;
  compteurBonus: number = 0; // nombre d'invitations restantes (maxBonus - invites)
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

  // Si on arrive avec un lien de parrainage ?invite=TOKEN
  const urlParams = new URLSearchParams(window.location.search);
  const tokenInvite = urlParams.get('invite');

  if (tokenInvite) {
    // Trouver le joueur par son token
    for (let mail in this.emailsInscrits) {
      const joueur = this.emailsInscrits[mail];
      if (!joueur) continue;

      if (joueur.token === tokenInvite) {
        // Vérifier combien d'amis ont déjà été invités
        const invites = parseInt(localStorage.getItem(mail + '_invites') || '0', 10);

        if (invites < this.maxBonus) {
          const newInvites = invites + 1;
          localStorage.setItem(mail + '_invites', newInvites.toString());

          // Accorder une tentative seulement à ce moment-là
          joueur.tentatives = Math.max(0, joueur.tentatives - 1); // redonner une tentative
          localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));

          // Mettre à jour compteur pour affichage
          this.majCompteur(mail);
        }

        // Optionnel : afficher un message si l'ami vient de s'inscrire
        alert(`🎉 Un ami vous a rejoint ! Vous pouvez maintenant rejouer.`);

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

      // initialiser invites si absent
      if (!localStorage.getItem(emailLower + '_invites')) {
        localStorage.setItem(emailLower + '_invites', '0');
      }
    }

    this.joueurActuel = joueur; // maintenant joueurActuel est bien défini
    this.majCompteur(emailLower);

    // Si joueur existe et a >=3 tentatives, on lui dit d’inviter un ami
    if (joueur.tentatives >= 3 && this.compteurBonus > 0) {
      this.resultatMessage = `❌ Vous avez atteint le maximum de tentatives ! Invitez un ami pour obtenir une seconde chance (${this.maxBonus - this.compteurBonus}/${this.maxBonus} utilisés).`;
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
  }

  // ================== LOGIQUE DU JEU ==================
  genererCode(longueur: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: longueur }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }

  nouvellePartie(): void {
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
  }

  verifierCode(): void {
    const input = this.lettreSaisie.toUpperCase();
    const emailLower = this.email.toLowerCase();
    const joueur = this.joueurActuel;

    if (!joueur) {
      alert('Veuillez vous inscrire avant de jouer.');
      return;
    }

    joueur.tentatives++;
    localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));

    if (input === this.lettreCorrecte) {
      clearInterval(this.timer);
      this.resultatMessage = '🎉 Félicitations ! Vous avez trouvé la bonne lettre 🎯';
      this.resultColor = 'green';
      this.chrono = 0;

      setTimeout(() => document.getElementById('btnContinuer')?.scrollIntoView({ behavior: 'smooth' }), 300);

    } else {
      const invites = parseInt(localStorage.getItem(emailLower + '_invites') || '0', 10);

      if (joueur.tentatives >= 3 && invites < this.maxBonus) {
        // Afficher message + bouton inviter
        this.resultatMessage = `❌ Vous avez atteint le maximum de tentatives ! Invitez un ami pour rejouer (${invites}/${this.maxBonus} invités).`;
        this.resultColor = 'red';
        this.afficherBonus = true;
        this.majCompteur(emailLower);
      } else if (joueur.tentatives >= 3 && invites >= this.maxBonus) {
        clearInterval(this.timer);
        this.resultatMessage = '❌ Vous avez atteint le maximum de tentatives et déjà invité 3 amis.';
        this.resultColor = 'red';
        this.codeAffiche = '---';
        this.afficherBonus = false;
      } else {
        this.resultatMessage = '❌ Mauvais choix... retentez votre chance !';
        this.resultColor = 'red';
      }
    }
  }

inviterAmi(): void {
  const emailLower = this.email.toLowerCase();
  const joueur = this.emailsInscrits[emailLower];

  if (!joueur) {
    alert('Veuillez vous inscrire avant d’inviter un ami.');
    return;
  }

  let invites = parseInt(localStorage.getItem(emailLower + '_invites') || '0', 10);

  if (invites >= this.maxBonus) {
    alert('❌ Vous avez déjà invité 3 amis. Plus de seconde chance possible.');
    this.afficherBonus = false;
    return;
  }

  // Générer un lien de parrainage
  this.lienParrainage = `${window.location.href.split('?')[0]}?invite=${joueur.token}`;

  // Copier dans le presse-papiers si possible
  navigator.clipboard?.writeText(this.lienParrainage).then(() => {
    alert(`📩 Lien copié ! Partagez-le avec un ami pour obtenir une seconde chance.\n\n${this.lienParrainage}`);
  }).catch(() => {
    alert(`📩 Partagez ce lien avec un ami pour obtenir une seconde chance :\n\n${this.lienParrainage}`);
  });

  // Marquer que l’invitation a été envoyée
  this.invitationEnvoyee = true;

  // Afficher un message mais **ne pas relancer le chrono ni le code**
  this.resultatMessage = '✅ Invitation envoyée ! Votre seconde chance sera disponible quand l’ami s’inscrira.';
  this.resultColor = 'blue';
  this.afficherBonus = false;

  // Incrémenter le compteur d'invitations côté parrain
  invites++;
  localStorage.setItem(emailLower + '_invites', invites.toString());
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
    if (!joueur) return;

    // Considérer comme tentative utilisée à la fin du chrono
    joueur.tentatives++;
    localStorage.setItem('emailsJeu', JSON.stringify(this.emailsInscrits));

    this.codeAffiche = '---';
    this.resultatMessage = '⏰ Temps écoulé ! Invitez un ami pour rejouer.';
    this.resultColor = 'orange';

    this.afficherBonus = true;
    const invites = parseInt(localStorage.getItem(emailLower + '_invites') || '0', 10);
    this.bonusDisponible = invites < this.maxBonus;
    if (this.bonusDisponible) {
      this.lienParrainage = `${window.location.href.split('?')[0]}?invite=${joueur.token}`;
    }
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
    if (!this.lienParrainage) {
      alert('Aucun lien à copier.');
      return;
    }
    navigator.clipboard.writeText(this.lienParrainage)
      .then(() => alert('Lien copié ! Partagez-le avec vos amis.'));
  }

  partager(reseau: 'facebook' | 'whatsapp' | 'twitter' | 'instagram'): void {
    const url = encodeURIComponent(window.location.href.split('?')[0] + '?invite=' + encodeURIComponent(this.lienParrainage?.split('?invite=')[1] || ''));
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
