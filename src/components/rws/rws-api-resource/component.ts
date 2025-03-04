import { IKDBTypesResponse } from '../../../types/IBackendCore';
import { observable, attr } from '@microsoft/fast-element';
import { RWSView } from '../../_decorator';
import { RWSViewComponent } from '../../_component';
import { RWSResourceListComponent } from './variants/list/component';
import { RWSResourceFormComponent } from './variants/form/component';
import { IRWSResourceQuery } from '../../../types/IRWSResource';
import { ActionType, IExtraColumnFormatter, IFlexTableColumn } from '../rws-table/component';


RWSResourceListComponent;
RWSResourceFormComponent;

@RWSView('rws-resource')
class RWSApiResource extends RWSViewComponent {    
    @attr resource: string; 
    @attr resourceLabel: string = null;

    @attr createEntryLabel = 'Create entry';
    @attr listEntryLabel = 'Entries list';

    @attr createEnabled = 'true'; 
    @attr emptyLabel: string = 'No records';

    @observable dbModelData: IKDBTypesResponse = null;

    @observable viewType: 'list' | 'form' = 'list';
    
    @observable fields: string[] = [];
    @observable extraFormatters: {[header_key: string] : IExtraColumnFormatter} = {};  
    @observable headerTranslations: {[header_key: string] : string} = {};  

    @observable listActions: ActionType[] = []; 

    @observable back: (resource: any) => Promise<void> = async (resource: any) => {
        this.viewType = 'list';
    };

    async connectedCallback(): Promise<void> 
    {
        super.connectedCallback();
        this.dbModelData = await this.apiService.getResource(this.resource);          
    }

    toggleForm()
    {
        this.viewType = this.viewType === 'form' ? 'list' : 'form';
    }
}

RWSApiResource.defineComponent();

export { RWSApiResource };