import { observable, attr } from '@microsoft/fast-element';
import { RWSViewComponent} from '../../_component';
import { RWSView} from '../../_decorator';

export interface IFlexTableColumn {
    key: string;
    header: string;
    formatter?: (value: any) => string;
}

export type IExtraColumnFormatter<T = unknown> = (inputType: T) => string;

export type ActionType = {
    key: string,
    label: string,
    variant: string,
    handler: (id: string) => Promise<void>
}
 
@RWSView('rws-table')
class RWSTable extends RWSViewComponent {     
    @attr emptyLabel: string = 'No records'; 
    @observable columns: IFlexTableColumn[] = [];

    @observable dataColumns: IFlexTableColumn[] = [];
    @observable data: any[] = [];
    @observable fields: string[] = [];

    @observable actions: ActionType[] = [];

    @observable extraFormatters: {[header_key: string] : IExtraColumnFormatter} = {};    
    @observable headerTranslations: { [sourceKey: string]: string } = {};

    connectedCallback(): void {
        super.connectedCallback();

        this.orderFields();
    }

    headerTranslationsChanged(oldValue: { [sourceKey: string]: string }, newValue: { [sourceKey: string]: string })
    {
        this.orderFields();
    }

    fieldsChanged(oldValue: string[], newValue: string[])
    {
        this.orderFields();
    }
    
    columnsChanged(oldValue: IFlexTableColumn[], newValue: IFlexTableColumn[])
    {        
        this.orderFields();
    }

    orderFields(): void
    {
        if(this.columns  && this.fields && this.fields.length && this.columns.length){            
            const orderedColumns: IFlexTableColumn[] = [];            

            for(const fieldKey of this.fields){
                const found = this.columns.find(item => item.key === fieldKey);

                if(found){
                    if(Object.keys(this.extraFormatters).includes(fieldKey)){
                        found.formatter = this.extraFormatters[fieldKey];
                    }

                    if(this.headerTranslations && Object.keys(this.headerTranslations).includes(fieldKey)){
                        found.header = this.headerTranslations[fieldKey];
                    }

                    orderedColumns.push(found);
                }                
            }                        

            this.dataColumns = orderedColumns;            
        }else{
            this.dataColumns = this.columns;
        }
    }
}

RWSTable.defineComponent();

export { RWSTable };