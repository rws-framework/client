import { RWSView } from '../../_decorator';
import { RWSViewComponent } from '../../_component';
import { attr } from '@microsoft/fast-element';

@RWSView('rws-loader')
class RWSLoader extends RWSViewComponent {    
    connectedCallback(): void {
        super.connectedCallback();
    }
}

RWSLoader.defineComponent();

export { RWSLoader };