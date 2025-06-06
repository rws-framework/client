import { IKDBTypeInfo } from "../../../../types/IBackendCore";

export type IReFormerOrder = IKDBTypeInfo[] | IReFormerOrder[];

export type IReFormerMassOrdering = IReFormerOrder[];