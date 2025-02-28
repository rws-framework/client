import { RWSView } from '../../../../index';
import { ReFormerFieldComponent } from '../_field';

@RWSView('reformer-text')
class ReFormerText extends ReFormerFieldComponent {}

ReFormerText.defineComponent();

export { ReFormerText };