export interface IKDBTypeInfo {
    fieldName: string;
    type: string;
    boundModel?: string
}

export interface IKDBTypesResponse {
    success: boolean;
    data: {
        types: IKDBTypeInfo[];
    };
}