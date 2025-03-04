import { observable } from '@microsoft/fast-element';
import { RWSViewComponent} from '../../_component';
import { RWSView} from '../../_decorator';

@RWSView('rws-modal')
class RWSModal extends RWSViewComponent {      
    @observable closeModal: () => void
    connectedCallback(): void {
        super.connectedCallback();        
    }
}

RWSModal.defineComponent();

export { RWSModal };