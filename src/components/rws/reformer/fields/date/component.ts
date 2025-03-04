import RWSViewComponent from '../../../../_component';
import { RWSView} from '../../../../_decorator';
import { attr, observable } from '@microsoft/fast-element';

@RWSView('reformer-date')
class ReFormerDate extends RWSViewComponent {
    @attr name: string;
    @observable defaultValue: Date = null;
    @observable value: Date = null;
    @observable setForm: (field: string, value: any) => Promise<void>; 

    connectedCallback(): void {
        super.connectedCallback();
        this.value = this.defaultValue;
    }
}

ReFormerDate.defineComponent();

export { ReFormerDate };
