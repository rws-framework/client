import { RWSUploader } from './rws/uploader/component';
import { RWSProgress } from './rws/progress/component';
import { RWSLoader } from './rws/loader/component';
import { RWSApiResource } from './rws/rws-api-resource/component';
import { ReFormer } from './rws/reformer/component';
import { RWSTable } from './rws/rws-table/component';
import { RWSModal } from './rws/rws-modal/component';
import { LineSplitter } from './rws/line-splitter/component';


function declareRWSComponents(parted: boolean = false): void
{
    if(!parted){
        RWSUploader;        
        RWSProgress;
        RWSLoader;
        RWSTable;
        RWSModal;
        LineSplitter;

        RWSApiResource;
        ReFormer;
    }
}

export { declareRWSComponents };