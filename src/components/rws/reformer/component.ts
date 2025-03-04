import { observable, attr } from '@microsoft/fast-element';
import { IKDBTypeInfo, IKDBTypesResponse } from '../../../types/IBackendCore';
import { RWSViewComponent} from '../../_component';
import { RWSView} from '../../_decorator';
import { ReFormerText } from './fields/text/component';
import { ReFormerDate } from './fields/date/component';
import { ReFormerNumber } from './fields/number/component';
import { ReFormerBoolean } from './fields/boolean/component';

ReFormerBoolean;
ReFormerNumber;
ReFormerText;
ReFormerDate;

@RWSView('rws-reformer')
class ReFormer extends RWSViewComponent {
    @attr resource: string;  

    @observable fields: string[] | null = null;
    @observable formFields: IKDBTypeInfo[];

    @observable modelTypes: IKDBTypesResponse;
    @observable setForm: (key: string, val: any) => void = this.setFormField.bind(this);
    @observable afterForm: (val: any) => Promise<void> = null;

    private payload: {[key: string]: any} = {};

    modelTypesChanged(oldVal:IKDBTypesResponse, newVal: IKDBTypesResponse)
    {
        console.log({newVal})
        if(newVal){
            this.formFields = newVal.data.types.filter((item) => !['id', 'created_at', 'updated_at'].includes(item.fieldName))
        }
    }

    setFormField(key: string, val: HTMLFormElement)
    {
        this.payload[key] = val.value;
    }

    paintLabel(input: string): string
    {
        return input;
    }

    async sendForm()
    {
        const resource = await this.apiService.back.post(`${this.resource}:create`, this.payload);
        this.payload = {};

        if(this.afterForm){
            this.afterForm(resource);
        }
    }
}

ReFormer.defineComponent();

export { ReFormer };
