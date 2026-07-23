import { Component } from '@angular/core';
import { CardComponent } from '../../components/card/card.component';

@Component({
    selector: 'app-ssr',
    imports: [CardComponent],
    templateUrl: './ssr.component.html',
    styleUrl: './ssr.component.scss',
    host: {
        'class': 'content'
    }
})
export class SsrComponent {}
