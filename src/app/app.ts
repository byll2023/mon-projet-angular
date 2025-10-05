import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';
import { environment } from '../environments/environment';
import { JeuComponent } from './jeu/jeu';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [JeuComponent, RouterModule], // 🔹 Ajout RouterModule ici
  template: `<app-jeu></app-jeu>`,
  styleUrls: ['./app.css']
})
export class AppComponent {}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      RouterModule.forRoot([]) // 🔹 Fournit ActivatedRoute
    ),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAnalytics(() => getAnalytics())
  ]
}).catch(err => console.error(err));
