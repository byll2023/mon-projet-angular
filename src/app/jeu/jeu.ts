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
      const auth = getAuth();

      onAuthStateChanged(auth, async (user) => {
        try {
          if (user?.email) {
            this.joueurActuel = await this.invitationService.getJoueur(user.email);

            if (this.joueurActuel) {
              this.lienInvitation = this.invitationService.creerLienInvitation(this.joueurActuel.token);
              this.compteurAmis = this.joueurActuel.amis?.length || 0;

              // 🔹 Chargement des phrases déjà jouées depuis Firestore
              if (this.joueurActuel.phrasesDejaJouees) {
                this.phrasesDejaJouees = new Set(this.joueurActuel.phrasesDejaJouees);
              }


              // Écoute en direct
              this.unsubscribeSnapshot = this.invitationService.ecouterCompteurAmis(
                user.email,
                (nbAmis) => { this.compteurAmis = nbAmis; }
              );
            }

            const inviteToken = this.route.snapshot.queryParamMap.get('invite');
            if (inviteToken) {
              await this.invitationService.ajouterAmi(inviteToken, user.email);
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
      '4NHyPfpmCWsVhqyAO'
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
      '4NHyPfpmCWsVhqyAO'
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

  finChronoOuEchec(): void {
    if (!this.joueurActuel) return;

    if (this.tentativeEnCours) {
      this.tentativeEnCours = false;
      this.joueurActuel.tentatives++;
    }

    this.resultatMessage = `⏰ Temps écoulé ! Le mot était : ${this.codeComplet}`;
    this.resultColor = 'orange';
    this.envoyerEmailEchecEtNotifierAdmin('temps écoulé');
  }
}