import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import emailjs from '@emailjs/browser';
import { InvitationService, JoueurFirestore } from '../services/invitation.service';
import { environment } from '../../environments/environment';
import { getAuth, onAuthStateChanged } from 'firebase/auth';


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

  // ================= VARIABLES JEU =================
  codeComplet: string = '';
  codeAffiche: string = '';
  reponseSaisie: string = '';
  chrono: number = 30;
  timer!: ReturnType<typeof setInterval>;
  maxBonus: number = 3;
  compteurBonus: number = 0;
  tentativeEnCours: boolean = false;


  // ================= AFFICHAGE =================
  afficherInscription: boolean = false;
  afficherJeu: boolean = false;
  afficherAdresse: boolean = false;
  afficherBonus: boolean = false;
  bonusDisponible: boolean = true;
  resultatMessage: string = '';
  resultColor: string = 'black';
  victoire: boolean = false;
  afficherCode: boolean = true;
  afficherChrono: boolean = true;

  // ================= PHRASES =================
  phrases: { texte: string, mot: string }[] = [
  { texte: "Celui qui poursuit l’éclat oublie souvent l’ombre du ***", mot: "vrai" },
  { texte: "Les miroirs ne mentent pas, ils montrent ce que l’on ***", mot: "fuit" },
  { texte: "Les racines du savoir plongent dans la ***", mot: "patience" },
  { texte: "La pluie efface la poussière mais pas la ***", mot: "mémoire" },
  { texte: "Le temps polit ce que la vengeance ***", mot: "brise" },
  { texte: "Celui qui court après l’ombre perd la ***", mot: "lumière" },
  { texte: "Les promesses se fanent plus vite que les ***", mot: "roses" },
  { texte: "Le bruit attire la foule, le silence attire la ***", mot: "sagesse" },
  { texte: "Un esprit libre ne craint pas le ***", mot: "jugement" },
  { texte: "Les cœurs blessés écrivent les plus belles ***", mot: "vérités" },
  { texte: "Quand l’orgueil parle, la raison se ***", mot: "tait" },
  { texte: "Les plus grandes tempêtes naissent d’un simple ***", mot: "souffle" },
  { texte: "La peur construit des murs, le courage des ***", mot: "ponts" },
  { texte: "Les yeux voient, mais seuls les cœurs ***", mot: "comprennent" },
  { texte: "Un mot mal placé peut briser une ***", mot: "âme" },
  { texte: "Les cicatrices sont les tatouages du ***", mot: "courage" },
  { texte: "Ce n’est pas la mer qui noie, c’est le ***", mot: "courant" },
  { texte: "Les fleurs du mal poussent dans les *** fertiles", mot: "silences" },
  { texte: "L’amour sans courage n’est qu’un reflet sans ***", mot: "profondeur" },
  { texte: "Le temps enseigne ce que la colère fait ***", mot: "oublier" },
  { texte: "Les chaînes les plus lourdes sont celles que l’on ***", mot: "ignore" },
  { texte: "Celui qui regarde en arrière trébuche sur le ***", mot: "présent" },
  { texte: "Le pardon ne change pas le passé, mais éclaire le ***", mot: "chemin" },
  { texte: "Les esprits faibles se plaignent, les forts ***", mot: "avancent" },
  { texte: "Un cœur sans feu devient un corps sans ***", mot: "âme" },
  { texte: "Le bonheur ne s’achète pas, il se ***", mot: "cultive" },
  { texte: "Sous la cendre du doute brûle souvent la ***", mot: "certitude" },
  { texte: "L’eau claire cache parfois les *** profondes", mot: "abysses" },
  { texte: "Un cœur sans rêves est comme un désert sans ***", mot: "mirage" },
  { texte: "Les mots soignent parfois mieux que les ***", mot: "mains" },
  { texte: "L’égo nourrit l’orgueil, l’humilité nourrit la ***", mot: "grandeur" },
  { texte: "Un mensonge répété devient une *** crue", mot: "illusion" },
  { texte: "Le vrai pouvoir ne s’impose pas, il se ***", mot: "gagne" },
  { texte: "Les pas du sage laissent des traces dans la ***", mot: "poussière" },
  { texte: "Les vérités amères font pousser les *** dures", mot: "leçons" },
  { texte: "On reconnaît l’âme d’un homme à ses ***", mot: "silences" },
  { texte: "Les rêves meurent quand la peur prend les ***", mot: "commandes" },
  { texte: "L’échec n’est qu’un détour sur le chemin du ***", mot: "succès" },
  { texte: "Un mot sincère vaut mille ***", mot: "excuses" },
  { texte: "La solitude apprend à écouter le ***", mot: "cœur" },
  { texte: "Les blessures du temps guérissent dans le ***", mot: "silence" },
  { texte: "On ne trouve la paix qu’en cessant de ***", mot: "lutter" },
  { texte: "Le mensonge rassure, la vérité ***", mot: "libère" },
  { texte: "L’amour sans confiance est un ciel sans ***", mot: "soleil" },
  { texte: "La patience est la clef des portes du ***", mot: "destin" },
  { texte: "Les mots murmurés par le vent portent les ***", mot: "souvenirs" },
  { texte: "Celui qui écoute le tonnerre apprend la ***", mot: "force" },
  { texte: "La peur du vide crée les plus hautes ***", mot: "murailles" },
  { texte: "On ne dompte pas la mer, on apprend à ***", mot: "naviguer" }
];
  phrasesDejaJouees: Set<number> = new Set()
  phraseActuelle?: { texte: string, mot: string };

  // ================= VARIABLES JOUEUR =================
  prenom: string = '';
  email: string = '';
  lienInvitation?: string;
  accepterNewsletter: boolean = false;
  joueurActuel?: JoueurFirestore;
  invitationEnvoyee: boolean = false;
  compteurAmis = 0;
  unsubscribeSnapshot?: () => void;


  // ================= VARIABLES LIVRAISON =================
  adresse: string = '';
  ville: string = '';
  codePostal: string = '';
  emailAmi: string = ''; // Champ pour stocker l'email de l'ami à inviter

  // ================= AVIS GAGNANTS =================
  avisGagnants: Avis[] = [
    { image: 'assets/images/gagnant1.jpg', message: 'Super confortables, j’adore !', nom: 'Marie', ville: 'Montréal' },
    { image: 'assets/images/gagnant2.jpg', message: 'Merci Ferargile 🎉 je suis trop content !', nom: 'Karim', ville: 'Québec' },
    { image: 'assets/images/gagnant3.jpg', message: 'Chaussettes douces et chaudes, parfaites pour l’hiver.', nom: 'Sophie', ville: 'Laval' },
  ];

  constructor(
    private route: ActivatedRoute,
    private invitationService: InvitationService
  ) { }



  // ================= INIT =================
  ngOnInit() {
    try {
      // 1️⃣ — Sauvegarde immédiate du token d’invitation dans le localStorage
      const inviteTokenFromUrl = this.route.snapshot.queryParamMap.get('invite');
      if (inviteTokenFromUrl) {
        localStorage.setItem('pendingInviteToken', inviteTokenFromUrl);
        localStorage.setItem('pendingInviteToken_ts', Date.now().toString());
        console.log('📩 Token invitation sauvegardé:', inviteTokenFromUrl);
      }

      const auth = getAuth();
      onAuthStateChanged(auth, async (user) => {
        try {
          if (user?.email) {
            const emailLower = user.email.toLowerCase();
            this.joueurActuel = await this.invitationService.getJoueur(emailLower);

            // 2️⃣ — S’il n’existe pas encore dans "invitations", on le crée
            if (!this.joueurActuel) {
              const token = Math.random().toString(36).substring(2, 10);
              const nouveauJoueur = {
                email: emailLower,
                prenom: user.displayName || '',
                token,
                amis: [],
                tentatives: 0,
              };
              await this.invitationService.sauvegarderJoueur(nouveauJoueur);
              this.joueurActuel = nouveauJoueur;
            }

            // 3️⃣ — Création / mise à jour du lien d’invitation
            this.lienInvitation = this.invitationService.creerLienInvitation(this.joueurActuel.token);
            this.compteurAmis = this.joueurActuel.amis?.length || 0;

            // 🔹 Si phrases déjà jouées, on les recharge
            if (this.joueurActuel.phrasesDejaJouees) {
              this.phrasesDejaJouees = new Set(this.joueurActuel.phrasesDejaJouees);
            }

            // 4️⃣ — Écoute en direct du compteur d’amis
            this.unsubscribeSnapshot = this.invitationService.ecouterCompteurAmis(
              emailLower,
              (nbAmis) => (this.compteurAmis = nbAmis)
            );

            // 5️⃣ — Traitement du token (URL ou sauvegardé)
            const inviteToken =
              this.route.snapshot.queryParamMap.get('invite') ||
              (await this.invitationService.getPendingToken());

            if (inviteToken) {
              try {
                await this.invitationService.ajouterAmi(inviteToken, emailLower);
                console.log('✅ Ami ajouté via le token:', inviteToken);
                await this.invitationService.supprimerPendingToken();
              } catch (err) {
                console.error('Erreur ajout ami:', err);
              }
            }
          }
        } catch (err) {
          console.error('Erreur auth/Firestore ngOnInit:', err);
        }
      });
    } catch (err) {
      console.error('Erreur ngOnInit JeuComponent:', err);
    }
  }

  ngOnDestroy() {
    if (this.unsubscribeSnapshot) this.unsubscribeSnapshot();
    clearInterval(this.timer);
  }

  // ================= GETTERS =================
  get invites(): number {
    return this.joueurActuel?.amis?.length || 0; // 🔹 MODIF
  }

  get invitesLabel(): string { // 🔹 MODIF
    return `${this.invites}/3`;
  }

  get afficherBoutonContinuer(): boolean {
    return this.victoire && !this.afficherAdresse;
  }

  // ================= AFFICHAGE FORMULAIRE =================
  afficherFormulaire(): void {
    this.afficherInscription = true;
  }

  // ================= INSCRIPTION =================
  async inscription(): Promise<void> {
    try {
      if (!this.email) return alert('Veuillez saisir votre email.');

      const emailLower = this.email.toLowerCase();
      const joueurExistant = await this.invitationService.getJoueurParEmail(emailLower);

      if (joueurExistant) {
        this.joueurActuel = joueurExistant;

        if (joueurExistant.tentatives >= 1 && joueurExistant.amis.length < 3) {
          this.lienInvitation = joueurExistant.lienInvitation
            || this.invitationService.creerLienInvitation(joueurExistant.token);
          await this.invitationService.sauvegarderJoueur({ ...joueurExistant, lienInvitation: this.lienInvitation });
          alert('Vous avez déjà joué ! Invitez 3 amis pour une seconde chance.');
          this.afficherJeu = true;
          return;
        }
      } else {
        const token = btoa(emailLower + Date.now());
        const nouveauJoueur: JoueurFirestore = {
          email: emailLower,
          prenom: this.prenom || 'Participant',
          token,
          amis: [],
          tentatives: 0
        };
        await this.invitationService.sauvegarderJoueur(nouveauJoueur);
        this.joueurActuel = nouveauJoueur;
      }

      this.afficherInscription = false;
      this.afficherJeu = true;
      await this.nouvellePartie();
      this.startTimer();

      this.processPendingInviteFor(emailLower);

    } catch (err) {
      console.error('Erreur inscription:', err);
    }
  }

  private processPendingInviteFor(registeringEmail: string): void {
    try {
      const token = localStorage.getItem('pendingInviteToken');
      if (!token) return;

      if (this.joueurActuel?.token === token) {
        localStorage.removeItem('pendingInviteToken');
        localStorage.removeItem('pendingInviteToken_ts');
        return;
      }

      this.invitationService.ajouterAmi(token, registeringEmail);
      localStorage.removeItem('pendingInviteToken');
      localStorage.removeItem('pendingInviteToken_ts');
    } catch (err) {
      console.error('Erreur processPendingInviteFor:', err);
    }
  }

  // ================= JEU =================
  async nouvellePartie(): Promise<void> {
    if (!this.joueurActuel) return;

    // 🔹 Recharge les données réelles du joueur depuis Firestore
    const joueurMaj = await this.invitationService.getJoueur(this.joueurActuel.email);
    if (joueurMaj) this.joueurActuel = joueurMaj;

    // 🔹 Bloque s’il a déjà joué une fois et n’a pas encore invité 3 amis
    if (this.joueurActuel.tentatives >= 1 && this.joueurActuel.amis.length < 3) {
      alert('🚫 Vous avez déjà joué ! Invitez 3 amis pour débloquer une seconde chance.');
      this.tentativeEnCours = false;
      return;
    }

    // 🔹 Si le joueur a invité 3 amis ou plus → réinitialiser la tentative
    if (this.joueurActuel.tentatives >= 1 && this.joueurActuel.amis.length >= 3) {
      this.joueurActuel.tentatives = 0;
      await this.invitationService.sauvegarderJoueur(this.joueurActuel);
      alert('✅ Vous avez débloqué une seconde chance ! Bonne chance 🎉');
    }

    // 🔹 Démarre une nouvelle partie
    this.tentativeEnCours = true;
    this.afficherCode = true;
    this.afficherChrono = true;

    // 🔹 Réinitialise si toutes les phrases ont été jouées
    if (this.phrasesDejaJouees.size >= this.phrases.length) {
      this.phrasesDejaJouees.clear();
    }

    // 🔹 Choisit une phrase jamais jouée
    let index: number;
    do {
      index = Math.floor(Math.random() * this.phrases.length);
    } while (this.phrasesDejaJouees.has(index));

    this.phraseActuelle = this.phrases[index];
    this.phrasesDejaJouees.add(index);

    // 🔹 Sauvegarde les phrases jouées dans Firestore
    if (this.joueurActuel) {
      this.joueurActuel.phrasesDejaJouees = Array.from(this.phrasesDejaJouees);
      await this.invitationService.sauvegarderJoueur(this.joueurActuel);
    }

    // 🔹 Sauvegarde locale (en cas de refresh)
    localStorage.setItem('phrasesDejaJouees', JSON.stringify(Array.from(this.phrasesDejaJouees)));


    this.codeComplet = this.phraseActuelle.mot.toUpperCase();
    const traitLong = '_'.repeat(this.phraseActuelle.mot.length);
    this.codeAffiche = this.phraseActuelle.texte.replace(/\*+/g, traitLong);

    this.resultatMessage = '';
    this.reponseSaisie = '';
    this.afficherBonus = false;
    this.tentativeEnCours = true;
  }

  async verifierCode(): Promise<void> {
    if (!this.joueurActuel) { alert('Veuillez vous inscrire avant de jouer.'); return; }

    if (this.joueurActuel.tentatives >= 1 && this.joueurActuel.amis.length < 3) {
      this.lienInvitation = this.invitationService.creerLienInvitation(this.joueurActuel.token);
      alert('🚫 Vous avez déjà joué ! Invitez 3 amis pour une seconde chance.');
      this.tentativeEnCours = false;
      return;
    }
    
    if (!this.tentativeEnCours) {
      alert('⏰ Temps écoulé ou tentative déjà utilisée.');
      return;
    }

    this.tentativeEnCours = false;
    const input = this.reponseSaisie.trim().toUpperCase();
    this.joueurActuel.tentatives++;
    clearInterval(this.timer);

    if (input === this.codeComplet) {
      this.resultatMessage = '🎉 Bravo ! Vous avez trouvé le mot manquant (Appuyer sur Continuer)🎯';
      this.resultColor = 'green';
      this.victoire = true;
      this.notifierAdmin(
        `Le joueur ${this.joueurActuel.prenom} (${this.joueurActuel.email}) a gagné le jeu.`,
        'jeu',
        this.codeComplet
      );

      // 🧹 Nettoyage des phrases jouées après victoire
      this.phrasesDejaJouees.clear();
      localStorage.removeItem('phrasesDejaJouees');

      if (this.joueurActuel) {
        this.joueurActuel.phrasesDejaJouees = [];
        await this.invitationService.sauvegarderJoueur(this.joueurActuel);
      }

    } else {
      this.resultatMessage = `❌ Mauvais choix... Le mot était "${this.codeComplet}".`;
      this.resultColor = 'red';
      this.envoyerEmailEchecEtNotifierAdmin('mauvaise réponse');

    }
    await this.invitationService.sauvegarderJoueur(this.joueurActuel);
  }
  // ================= COPIER LIEN =================
  copierLien(): void {
    if (!this.lienInvitation) return;
    navigator.clipboard.writeText(this.lienInvitation)
      .then(() => alert('Lien copié ! Partage-le avec tes amis 🎉'))
      .catch(() => alert('Erreur lors de la copie du lien.'));
  }

  // ================= ADRESSE =================
  passerAdresse(): void {
    this.afficherAdresse = true;
    setTimeout(() => document.getElementById('adresseForm')?.scrollIntoView({ behavior: 'smooth' }), 300);
  }

  validerAdresse(): void {
    if (!this.prenom || !this.adresse || !this.ville || !this.codePostal) {
      alert('Veuillez remplir tous les champs.');
      return;
    }
    if (this.joueurActuel) {
      this.invitationService.sauvegarderJoueur({
        ...this.joueurActuel,
        adresse: this.adresse,
        ville: this.ville,
        codePostal: this.codePostal
      });
    }

    this.envoyerEmail(); // Envoie l'email au joueur
    this.notifierAdminGagnant();           // Notifie l’admin

    alert(`Merci ${this.prenom} ! Votre adresse a été enregistrée pour la livraison.`);
    this.afficherAdresse = false;

  }

  envoyerEmail(): void {
    if (!this.prenom || !this.email || !this.adresse || !this.ville || !this.codePostal) return;

    const messageLivraison = `
      Nous vous enverrons un mail de confirmation la veille de votre livraison.
      L’estimation de la durée de livraison est de 3 à 4 jours ouvrables.
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
      .catch(err => console.error('Erreur EmailJS client:', err));
  }

  // ================= ADMIN =================
  // Méthode générique pour notifier l’admin
  private notifierAdmin(
    message: string,
    type: 'jeu' | 'invitation' | 'livraison' = 'jeu',
    motGagnant?: string
  ): void {
    const templateParams: any = { message, type };

    // Ajoute le mot gagnant si fourni (nom du champ : motGagnant)
    if (motGagnant) {
      templateParams.motGagnant = motGagnant;
    }

    emailjs.send(
      'service_9od4cf4',
      'template_jiceud5',
      templateParams,
      't3wLzAi9_luRE7pJT'
    )
      .then(() => console.log(`✅ Admin notifié : ${message}`))
      .catch(err => console.error('Erreur EmailJS admin:', err));
  }
  // Méthode spécifique pour un gagnant
  private notifierAdminGagnant(): void {
    if (!this.prenom || !this.email || !this.adresse || !this.ville || !this.codePostal) return;

    const templateParams = {
      prenom: this.prenom,
      email: this.email,
      adresse: this.adresse,
      ville: this.ville,
      codePostal: this.codePostal,
      message: `Le joueur ${this.prenom} (${this.email}) a gagné le jeu.`
    };

    emailjs.send(
      'service_9od4cf4',
      'template_jiceud5',
      templateParams,
      't3wLzAi9_luRE7pJT'
    )
      .then(() => console.log(`✅ Admin notifié pour ${this.prenom} (${this.email})`))
      .catch(err => console.error('Erreur EmailJS admin:', err));
  }
  private envoyerEmailEchecEtNotifierAdmin(raison: 'mauvaise réponse' | 'temps écoulé'): void {
    if (!this.prenom || !this.email || !this.codeComplet) return;

    // Envoi de l'email au joueur
    emailjs.send('service_9od4cf4', 'template_dj7cys6', {
      to_email: this.email,
      prenom: this.prenom,
      code: this.codeComplet,
      raison: raison
    }, '4NHyPfpmCWsVhqyAO')
      .then(() => console.log(`📧 Email d'échec envoyé à ${this.email}`))
      .catch(err => console.error('Erreur EmailJS échec joueur:', err));

    // Notifier l'admin
    const message = `⚠️ Le joueur ${this.prenom} (${this.email}) a échoué (${raison}). Le mot était : ${this.codeComplet}`;
    this.notifierAdmin(message, 'jeu');
  }

  // ================= TIMER =================
  startTimer(): void {
    clearInterval(this.timer);
    this.chrono = 30;
    this.tentativeEnCours = true;

    this.timer = setInterval(() => {
      this.chrono--;
      if (this.chrono <= 0) {
        clearInterval(this.timer);
        this.finChronoOuEchec();
      }
    }, 1000);
  }

  async finChronoOuEchec(): Promise<void> {

    if (!this.joueurActuel) return;

    // 🔒 On bloque le jeu immédiatement
    if (this.tentativeEnCours) {
      this.tentativeEnCours = false;
      this.joueurActuel.tentatives++;
    }

    // 🔹 On n'affiche plus la bonne réponse
    this.resultatMessage = `⏰ Temps écoulé ! Vous n'avez pas eu le temps de répondre.`;
    this.resultColor = 'orange';

    // 🔹 On empêche toute nouvelle vérification ou saisie
    this.victoire = false;
    this.afficherCode = true; // tu peux laisser le texte visible
    this.reponseSaisie = ''; // efface ce qui était saisi
    this.afficherChrono = false;

    // 🔹 Sauvegarde l’échec du joueur et notifie l’admin
    this.envoyerEmailEchecEtNotifierAdmin('temps écoulé');

    // 🔹 Empêche une deuxième tentative sans relancer une nouvelle partie
    if (this.joueurActuel) {
      await this.invitationService.sauvegarderJoueur(this.joueurActuel);
    }
  }

}