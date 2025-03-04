import { RWSView } from '../../_decorator';
import { RWSViewComponent } from '../../_component';

@RWSView('the-loader')
class RWSLoader extends RWSViewComponent {
    connectedCallback(): void {
        super.connectedCallback();
    }
}

RWSLoader.defineComponent();

export { RWSLoader };