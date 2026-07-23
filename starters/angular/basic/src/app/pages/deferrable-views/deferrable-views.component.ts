import { Component } from '@angular/core';
import { CardComponent } from '../../components/card/card.component';

@Component({
    selector: 'app-deferrable-views',
    imports: [CardComponent],
    templateUrl: './deferrable-views.component.html',
    styleUrl: './deferrable-views.component.scss',
    host: {
        'class': 'content'
    }
})
export class DeferrableViewsComponent {

}
