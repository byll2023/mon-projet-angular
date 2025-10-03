// // src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import './firebase-config';

bootstrapApplication(AppComponent)
  .catch(err => console.error(err));
