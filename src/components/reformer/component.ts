import { RWSView, RWSViewComponent, observable, attr, IKDBTypesResponse } from '../../index';
import { ReFormerText } from './fields/text/component';

ReFormerText;

@RWSView('rws-reformer')
class ReFormer extends RWSViewComponent {
    @attr resourceName: string;  

    @observable fields: string[] | null = null;
    @observable modelTypes: IKDBTypesResponse;

    async connectedCallback(): Promise<void> 
    {
        this.modelTypes = await this.apiService.getResource(this.resourceName); 
    }

    setForm(key: string, val: any)
    {
        console.log('set reformer form', {key, val});
    }
}

ReFormer.defineComponent();

export { ReFormer };