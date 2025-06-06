import { RWSClientInstance } from "../client";
import IRWSConfig from "../types/IRWSConfig";

export const _DEFAULT_HR_PORT = 1030;

export interface IHotReloadCfg {
    enabled: boolean,
    port: number
}

async function hotReloadSetup(this: RWSClientInstance, config: IRWSConfig = {}): Promise<RWSClientInstance> 
{

    return this;
}

function getBinds(this: RWSClientInstance) {
    return {
        hotReloadSetup: hotReloadSetup.bind(this)       
    };
}

export default getBinds;