import { Component } from '@angular/core';
import { JeuComponent } from './jeu/jeu';


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        JeuComponent
    ], // ✅ Important pour les directives Angular dans le template
    templateUrl: './app.html',
    styleUrls: ['./app.css']
})
export class AppComponent { 
    
}