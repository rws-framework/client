import RWSService from './_service';
import { DOM } from '@microsoft/fast-element';
import DOMPurify from 'dompurify';

type TagsProcessorType = { [tagName: string]: string | Transformer };
type DOMOutputType<T extends Element> = NodeListOf<T> | T | null;

//@ts-ignore
declare let trustedTypes: TrustedTypePolicyFactory;


class DOMService extends RWSService {
    static _DEFAULT: boolean = true;
    parse$<T extends Element>(input: NodeListOf<T>, directReturn: boolean = false): DOMOutputType<T> {    
        if(input.length > 1 || directReturn) {
            return input;
        }
    
        if(input.length === 1) {
            return input[0];
        }
    
        return null;
    }

    $<T extends Element>(shadowRoot: ShadowRoot, selectors: string, directReturn: boolean = false): DOMOutputType<T> {        
        const elements = shadowRoot.querySelectorAll<T>(selectors);
        return elements ? this.parse$<T>(elements, directReturn) : null;    
    }

    async scrollToBottom(scrollContainer: HTMLDivElement, contentSelector: string = '.scroll-content') {
        if (scrollContainer) {
            const scrollContent = scrollContainer.querySelector(contentSelector) as HTMLElement;

            if (scrollContent) {
                scrollContainer.scrollTop = (scrollContent.scrollHeight - scrollContainer.clientHeight) + 150;              
            }
        }        
    }

    setHTMLPolicy(policyName: string, policyImplementation: (html: string) => string): void
    {
        const myPolicy = trustedTypes.createPolicy(policyName, {
            createHTML(html: string) {              
                return policyImplementation(html);
            }
        });
          
        DOM.setHTMLPolicy(myPolicy as any);        
    }

    private enforceAllowedTags(htmlText: string, allowedHTMLTags: string[]): string
    {
        // Create a regular expression pattern to match HTML tags
        const tagPattern = /<\s*\/?\s*([^\s>/]+)(\s+[^>]*)?>/g;

        // Replace any tags in the htmlText that are not in allowedHTMLTags array
        const sanitizedText = htmlText.replace(tagPattern, (match, tag, attributes) => {
            const lowerCaseTag = tag.toLowerCase();

            if (allowedHTMLTags.includes(lowerCaseTag)) {
                return match; // Return the original tag if it's allowed
            } else {
                // Replace the disallowed tag with an empty string
                return '';
            }
        });

        return sanitizedText;
    }   

    async onDOMLoad(): Promise<void>
    {
        return new Promise<void>((resolve) => {
            document.addEventListener('DOMContentLoaded', () => {
                resolve();
            });
        });
    }

    sanitizeHTML(
        line: string,                
        sanitizeOptions: DOMPurify.Config = { })
    {
        const output: string = line.trim();
        const sanitized = DOMPurify.sanitize(output, { USE_PROFILES: { html: true }, ...sanitizeOptions}) as string;
        return sanitized;
    }
}



export default DOMService.getSingleton();
export { DOMOutputType, DOMService, TagsProcessorType, DOMService as DOMServiceInstance }; 