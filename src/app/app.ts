// src/app/app.ts
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { JeuComponent } from './jeu/jeu';
import { app, analytics } from '../firebase-config'; // Assure-toi du bon chemin

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [JeuComponent],
  template: `<app-jeu></app-jeu>`,
  styleUrls: ['./app.css']
})
export class AppComponent {  ngOnInit(): void {
    // Vérifier que Firebase est initialisé
    console.log('Firebase app:', app);
    console.log('Firebase analytics:', analytics);

    if (app && analytics) {
      console.log('✅ Firebase fonctionne correctement !');
    } else {
      console.error('❌ Problème d’initialisation Firebase');
    }
  }
}

 

// Bootstrapping avec Firebase
bootstrapApplication(AppComponent, {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore())
  ]
});
