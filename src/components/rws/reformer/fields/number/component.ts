import RWSViewComponent from '../../../../_component';
import { RWSView} from '../../../../_decorator';
import { attr, observable } from '@microsoft/fast-element';

@RWSView('reformer-number')
class ReFormerNumber extends RWSViewComponent {
    @attr name: string;
    @observable defaultValue: number = null;
    @observable value: number = null;
    @observable setForm: (field: string, value: any) => Promise<void>;    

    connectedCallback(): void {
        super.connectedCallback();
        this.value = this.defaultValue;
    }
}

ReFormerNumber.defineComponent();

export { ReFormerNumber };
