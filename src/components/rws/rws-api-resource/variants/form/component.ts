import { attr, observable } from '@microsoft/fast-element';
import { IKDBTypesResponse } from '../../../../../types/IBackendCore';
import { RWSViewComponent} from '../../../../_component';
import { RWSView} from '../../../../_decorator';
import { IReFormerMassOrdering } from '../../../reformer/types/IReFormerTypes';


@RWSView('rws-resource-form')
class RWSResourceFormComponent extends RWSViewComponent {
    @attr resource: string;             
    
    @observable dbModelData: IKDBTypesResponse = null;
    @observable formOrdering: IReFormerMassOrdering = [];
    @observable back: (resource: any) => Promise<void>;

    connectedCallback(): void 
    {
        super.connectedCallback();
        this.createOrdering();
    }

    setForm()
    {

    }

    createOrdering()
    {
        for(const type of this.dbModelData.data.types){
            this.formOrdering.push(type as unknown as IReFormerMassOrdering);
        }
    }
}

RWSResourceFormComponent.defineComponent();

export { RWSResourceFormComponent };