import RWSViewComponent from '../../../../_component';
import { RWSView} from '../../../../_decorator';
import { attr, observable } from '@microsoft/fast-element';

@RWSView('reformer-boolean')
class ReFormerBoolean extends RWSViewComponent {
    @attr name: string;
    @observable defaultValue: boolean = null;
    @observable value: boolean = null;
    @observable setForm: (field: string, value: any) => Promise<void>; 

    connectedCallback(): void {
        super.connectedCallback();
        this.value = this.defaultValue;
    }
}

ReFormerBoolean.defineComponent();

export { ReFormerBoolean };
