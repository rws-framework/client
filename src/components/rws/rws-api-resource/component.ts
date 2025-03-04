import { IKDBTypeInfo, IKDBTypesResponse } from '../../../types/IBackendCore';
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
     
    @attr emptyLabel: string = 'No records';

    @observable dbModelData: IKDBTypesResponse = null;
    @observable resourceList: any[] = [];
    @observable columns: IFlexTableColumn[] = [];

    @observable fields: string[] = [];
    @observable extraFormatters: {[header_key: string] : IExtraColumnFormatter} = {};  
    @observable headerTranslations: {[header_key: string] : string} = {};  

    @observable actions: ActionType[] = []; 

    async connectedCallback(): Promise<void> 
    {
        super.connectedCallback();

        this.dbModelData = await this.apiService.getResource(this.resource);  
        this.resourceList = await this.apiService.back.get(`${this.resource}:list`);

        const makeColumns: IFlexTableColumn[] = [];

        for(const key in Object.keys(this.dbModelData.data.types)){
            const responseObject: IKDBTypeInfo = this.dbModelData.data.types[key];

            makeColumns.push({
                key: responseObject.fieldName,
                header: responseObject.fieldName,                
            });
        }

        this.columns = makeColumns;
    }
}

RWSApiResource.defineComponent();

export { RWSApiResource };