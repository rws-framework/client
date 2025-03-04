import { observable, attr } from "@microsoft/fast-element";
import RWSViewComponent from "../../../_component";
import { IReFormerField } from "../../../../types/IReFormerField";

export abstract class ReFormerFieldComponent extends RWSViewComponent implements IReFormerField  {
    @attr name: string;
    @observable defaultValue: any;
    @observable setForm: (field: string, value: any) => Promise<void>;

    changeField(key: string, value: any)
    {        
        this.setForm(key, value);
    }
}