import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  getDocs,
  query,
  where,
  onSnapshot
} from '@angular/fire/firestore';
import { environment } from '../../environments/environment';

// ================== INTERFACE ==================
export interface JoueurFirestore {
  email: string;
  prenom: string;
  token: string;
  amis: string[];
  tentatives: number;
  invitationEnvoyee?: boolean;
  lienInvitation?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
}

// ================== SERVICE ==================
@Injectable({
  providedIn: 'root'
})
export class InvitationService {

  private pendingTokenKey = 'pendingInviteToken';
  private pendingTokenTsKey = 'pendingInviteToken_ts';

  constructor(private firestore: Firestore) { }

  // ================== JOUEURS ==================
  async sauvegarderJoueur(joueur: JoueurFirestore): Promise<void> {
    const joueurRef = doc(this.firestore, `invitations/${joueur.email}`);
    await setDoc(joueurRef, joueur, { merge: true });
  }

  async getJoueur(email: string): Promise<JoueurFirestore | undefined> {
    const joueurRef = doc(this.firestore, 'joueurs', email);
    const joueurSnap = await getDoc(joueurRef);

    if (joueurSnap.exists()) {
      const joueur = joueurSnap.data() as JoueurFirestore;

      // ✅ Correction automatique du lien localhost
      if (joueur.lienInvitation?.includes('localhost')) {
        const nouveauLien = this.creerLienInvitation(joueur.token);
        await updateDoc(joueurRef, { lienInvitation: nouveauLien });
        joueur.lienInvitation = nouveauLien;
        console.log(`🔄 Lien corrigé pour ${email}: ${nouveauLien}`);
      }

      return joueur;
    }

    return undefined;
  }


  async getJoueurParEmail(email: string): Promise<JoueurFirestore | null> {
    const joueursRef = collection(this.firestore, 'invitations');
    const q = query(joueursRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as JoueurFirestore;
  }

  // ================== AMIS ==================
  async ajouterAmi(inviterToken: string, nouveauAmiEmail: string): Promise<void> {
    const joueursRef = collection(this.firestore, 'invitations');
    const q = query(joueursRef, where('token', '==', inviterToken));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const docRef = doc(this.firestore, `invitations/${snapshot.docs[0].id}`);
    await updateDoc(docRef, { amis: arrayUnion(nouveauAmiEmail) });
  }

  // ================== INVITATION ==================
  creerLienInvitation(token: string): string {
    // Utilise l'URL définie dans environment.ts ou environment.prod.ts
    return `${environment.baseUrl}/jeu?invite=${token}`;
  }
  async marquerInvitationEnvoyee(email: string): Promise<void> {
    const joueurRef = doc(this.firestore, `invitations/${email}`);
    const snap = await getDoc(joueurRef);
    if (!snap.exists()) return;
    await updateDoc(joueurRef, { invitationEnvoyee: true });
  }

  // ================== ÉCOUTE EN DIRECT ==================
  ecouterCompteurAmis(email: string, callback: (nbAmis: number) => void) {
    const joueurRef = doc(this.firestore, `invitations/${email}`);
    return onSnapshot(joueurRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as JoueurFirestore;
        const nbAmis = data.amis?.length || 0;
        callback(nbAmis);
      }
    });
  }

  // ================== TOKEN PENDING ==================
  async setPendingToken(token: string): Promise<void> {
    localStorage.setItem(this.pendingTokenKey, token);
    localStorage.setItem(this.pendingTokenTsKey, Date.now().toString());
  }

  async getPendingToken(): Promise<string | null> {
    return localStorage.getItem(this.pendingTokenKey);
  }

  async supprimerPendingToken(): Promise<void> {
    localStorage.removeItem(this.pendingTokenKey);
    localStorage.removeItem(this.pendingTokenTsKey);
  }
}
