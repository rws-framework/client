import { IKDBTypeInfo, IKDBTypesResponse } from '../../types/IBackendCore';
import { observable, attr } from '@microsoft/fast-element';
import { RWSView } from '../_decorator';
import { RWSViewComponent } from '../_component';
import { RWSResourceListComponent } from './variants/list/component';
import { RWSResourceFormComponent } from './variants/form/component';
import { IRWSResourceQuery } from '../../types/IRWSResource';


RWSResourceListComponent;
RWSResourceFormComponent;

@RWSView('rws-resource')
class RWSApiResource extends RWSViewComponent {      
    @observable dbModelData: IKDBTypesResponse;
}

RWSApiResource.defineComponent();

export { RWSApiResource };