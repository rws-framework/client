import { RWSView, RWSViewComponent, observable, attr } from '../../index';

@RWSView('rws-uploader')
class RWSUploader extends RWSViewComponent {

  @observable uploadProgress: number;

  @observable uploadedFile: File;
  @observable chosenFile: File;
  @observable uploadParams: any;

  @attr onFinish: (uploadResponse: any) => void;
  @attr onStart: (chosenFile: File, context: any) => Promise<unknown> = async (chosenFile: File) => chosenFile;
  @attr onProgress: (progress: number) => void = (progress: number) => null;


  async onUploadStart(): Promise<void>
  {    
        if(!this.uploadProgress){
            this.uploadProgress = 0;
        }

      const response = await this.onStart(this.chosenFile, this);
   
      if(response === null){
          return;
      }

      this.onFinish(response);

      this.uploadedFile = this.chosenFile;
      this.chosenFile = null;    
  }

  onChoose(): void
  {
      const _self = this;
      const fileInput = this.createFileInput();

      this.triggerUpload(fileInput);

      fileInput.addEventListener('change', () => {
          _self.chosenFile = fileInput.files[0]; 
          
          _self.uploadedFile = null;

          _self.removeFileInput(fileInput);      
      });
  }

  removeFile(){
      this.chosenFile = null;
  }

  private createFileInput(): HTMLInputElement
  {
      const fileInput: HTMLInputElement = document.createElement('input');
      fileInput.type = 'file';
      fileInput.style.display = 'none';


      this.shadowRoot.appendChild(fileInput);
      return fileInput;
  }

  private triggerUpload(fileInput: HTMLInputElement): void
  {
      fileInput.click();
  }

  private removeFileInput(fileInput: HTMLInputElement): void
  {
      this.shadowRoot.removeChild(fileInput);
  }

  uploadProgressChanged(oldV: any, newV: any)
  {
    
  }
}

RWSUploader.defineComponent();

export { RWSUploader };