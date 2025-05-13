import { RWSViewComponent } from '../../../components/_component';
import { RWSView } from '../../../components/_decorator';
import { observable, attr } from '@microsoft/fast-element';

import { ViewTemplate } from '@microsoft/fast-element';

@RWSView('line-splitter', { debugPackaging: false })
class LineSplitter extends RWSViewComponent {
  @observable text: string = '';
  @observable content: string | ViewTemplate = '<span class="dots">.</span>';
  @observable query: string = '';
  
  @attr allowedTags = '';
  @attr addClass = '';  

  private allowedHTMLTags: string[] = ['dl', 'dt', 'dd', 'br', 'blockquote', 'span', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'strong', 'i', 'small', 'u'];


  parseTags(line: string): string | ViewTemplate
  {     
    const componentAllowedTags: string[] = this.allowedHTMLTags.concat(this.allowedTags.split(','));  

    let output = this.domService.sanitizeHTML(line, { ADD_TAGS: [], ALLOWED_TAGS: componentAllowedTags });      

    output = output.replace(/<.*>([\s\S]*?)<\/.*>/g, (match: string) => {
        return match.replace(/\n/g, '');
    });
    output = output.replace(/\n\n/g, '\n');
    output = output.replace(/\n/g, '<br/>');
    output = output.replace(/<\/p><br\/>/g, '</p>');
    output = output                
        .replace(/<br\/><h([1-3])>/g, '<h$1>')
        .replace(/<\/h([1-3])><br\/>/g, '</h$1>');

    if(this.query !== null || this.query !== '')    {
      const query: string[] = this.query ? this.query.split(',').map(word => word.trim()) : []; 

      query.forEach(word => {
          // Create a regex for the word, ensuring it's case-insensitive and doesn't affect existing HTML tags
          const regex = new RegExp(`(${word})(?![^<]*>)`, 'gi');
          output = output.replace(regex, '<span class="tagged">$1</span>');
      });
    }
   

    return output;
  }

  splitLines(): void
  {    
      if([". ", ". . ", ". . . "].includes(this.text)){
          this.content = `<span class="dots">${this.text}</span>`
      }else{
        this.content = this.parseTags(this.text);
      }
  }

  textChanged(oldVal: string, newVal: string)
  {    
      if(newVal){        
        this.text = newVal;         
        this.splitLines();
      }
  }

  addClassChanged(oldVal: string, newVal: string)
  {
      if(newVal){
          this.addClass = newVal;
      }
  }

  connectedCallback(): void {
      super.connectedCallback();

      if(this.text){
        this.splitLines();
      }
  }

  queryChanged(oldVal: string, newVal: string){
    if(newVal){
      this.splitLines();
    }
  }
}

LineSplitter.defineComponent();

export { LineSplitter };