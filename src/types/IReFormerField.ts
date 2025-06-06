export interface IReFormerField {
    name: string,
    defaultValue?: any,
    setForm: (field: string, value: any) => Promise<void>   
}