import { RWSUploader } from './uploader/component';
import { RWSProgress } from './progress/component';
import { RWSLoader } from './loader/component';
import { RWSApiResource } from './rws-api-resource/component';
import { ReFormer } from './reformer/component';


function declareRWSComponents(parted: boolean = false): void
{
    if(!parted){
        RWSUploader;        
        RWSProgress;
        RWSLoader;

        RWSApiResource;
        ReFormer;
    }
}

export { declareRWSComponents };