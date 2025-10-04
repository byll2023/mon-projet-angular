// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';

// Firebase AngularFire
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

// Ton environnement avec firebaseConfig
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), // ✅ Init Firebase
    provideFirestore(() => getFirestore()) // ✅ Fournit Firestore à Angular
  ]
}).catch(err => console.error(err));
