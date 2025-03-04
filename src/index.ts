import { Transformer as HTMLTagTransformerType, Tag as HTMLTag, Attributes as HTMLAttributes } from 'sanitize-html';
import { observable, attr } from '@microsoft/fast-element';

import RWSService from './services/_service';
import ConfigService, { ConfigServiceInstance } from './services/ConfigService';
import NotifyService, {NotifyServiceInstance} from './services/NotifyService';
import DOMService, { DOMServiceInstance } from './services/DOMService';
import ApiService, { ApiServiceInstance } from './services/ApiService';
import UtilsService, {UtilsServiceInstance} from './services/UtilsService';
import ServiceWorkerService, { ServiceWorkerServiceInstance } from './services/ServiceWorkerService';
import { ngAttr } from './components/_attrs/angular-attr';
import { externalObservable } from './components/_attrs/external-observable';
import { externalAttr } from './components/_attrs/external-attr';
import { RWSPlugin } from './plugins/_plugin';
import RWSClient, { RWSClientInstance } from './client';
import RWSViewComponent from './components/_component';
import RWSContainer from './components/_container';

import {  RWSIgnore, RWSInject, RWSView } from './components/_decorator';
import { declareRWSComponents } from './components';

import type { DefaultRWSPluginOptionsType } from './plugins/_plugin';
import type { IRWSPlugin, IStaticRWSPlugin, IPluginSpawnOption } from './types/IRWSPlugin';
import type IRWSUser from './types/IRWSUser';
import type { IAssetShowOptions } from './components/_component';
import type { RWSDecoratorOptions } from './components/_decorator';
import type { IKDBTypeInfo, IKDBTypesResponse } from './types/IBackendCore';
import type { DOMOutputType, TagsProcessorType } from './services/DOMService';
import type { IBackendRoute, IHTTProute, IPrefixedHTTProutes } from './services/ApiService';
import type IRWSConfig from './types/IRWSConfig';
import type RWSNotify from './types/RWSNotify';
import type { NotifyUiType, NotifyLogType }  from './types/RWSNotify';

export default RWSClient;

export { 
    RWSClient,
    RWSClientInstance,

    RWSPlugin,
    IPluginSpawnOption,
    IRWSPlugin, IStaticRWSPlugin,
    DefaultRWSPluginOptionsType,    
    ApiServiceInstance,
    ApiService,    
    UtilsServiceInstance,    
    UtilsService,    
    DOMServiceInstance,
    DOMService,
    DOMOutputType,
    NotifyServiceInstance,
    NotifyService,
    ConfigServiceInstance,
    ConfigService,
    ServiceWorkerServiceInstance,
    ServiceWorkerService,

    RWSNotify,

    RWSView,    
    RWSIgnore,
    RWSInject,    
    observable,
    externalObservable,
    externalAttr,
    attr,
    ngAttr,
    
    RWSService,
    RWSViewComponent,       
    declareRWSComponents,

    RWSContainer
};

export type {
    IKDBTypeInfo, IKDBTypesResponse,
    NotifyUiType,
    NotifyLogType,
    IBackendRoute as IRWSBackendRoute,
    RWSDecoratorOptions as IRWSDecoratorOptions,
    IHTTProute as IRWSHttpRoute,
    IPrefixedHTTProutes as IRWSPrefixedHTTProutes,    
    IAssetShowOptions as IRWSAssetShowOptions,
    IRWSConfig,
    IRWSUser,
    TagsProcessorType,
    HTMLTagTransformerType,
    HTMLTag,
    HTMLAttributes
}