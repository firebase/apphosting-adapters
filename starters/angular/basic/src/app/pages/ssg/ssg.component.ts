import { Component } from '@angular/core';
import { CardComponent } from '../../components/card/card.component';

@Component({
    selector: 'app-ssg',
    imports: [CardComponent],
    templateUrl: './ssg.component.html',
    styleUrl: './ssg.component.scss',
    host: {
        'class': 'content'
    }
})
export class SsgComponent {}
