import { observable } from '@microsoft/fast-element';
import { RWSViewComponent} from '../../_component';
import { RWSView} from '../../_decorator';

@RWSView('rws-modal')
class RWSModal extends RWSViewComponent {      
    @observable closeModal: () => void
    @observable onShowModal: ($: ShadowRoot) => void

    connectedCallback(): void {
        super.connectedCallback(); 
        if(this.onShowModal){
            this.onShowModal(this.shadowRoot);
        }       
    }
}

RWSModal.defineComponent();

export { RWSModal };