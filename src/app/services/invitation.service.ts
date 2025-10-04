import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from '@angular/fire/firestore';

export interface JoueurFirestore {
  email: string;
  prenom: string;
  token: string;
  amis: string[];
  tentatives: number;
}

@Injectable({ providedIn: 'root' })
export class InvitationService {
  constructor(private firestore: Firestore) {}

  // Crée ou met à jour un joueur
  async sauvegarderJoueur(joueur: JoueurFirestore) {
    const joueurRef = doc(this.firestore, `invitations/${joueur.email}`);
    const docSnap = await getDoc(joueurRef);

    if (!docSnap.exists()) {
      // Créer un nouveau document
      await setDoc(joueurRef, joueur);
    } else {
      // Mettre à jour les informations existantes
      await updateDoc(joueurRef, {
        prenom: joueur.prenom,
        token: joueur.token
      });
    }
  }

  // Ajouter un ami invité
  async ajouterAmi(emailJoueur: string, emailAmi: string) {
    const joueurRef = doc(this.firestore, `invitations/${emailJoueur}`);
    await updateDoc(joueurRef, {
      amis: arrayUnion(emailAmi)
    });
  }

  // Récupérer un joueur
  async getJoueur(email: string): Promise<JoueurFirestore | null> {
    const docSnap = await getDoc(doc(this.firestore, `invitations/${email}`));
    return docSnap.exists() ? (docSnap.data() as JoueurFirestore) : null;
  }
}
