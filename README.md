# RWS Frontend Framework README

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Key Components: RWSClient & RoutingService](#key-components-rwsclient--routingservice)
4. [Component Initialization](#component-initialization)
5. [Frontend routes](#frontend-routes)
6. [Backend Imports](#backend-imports)
7. [Utilizing APIService](#utilizing-apiservice)
8. [Notifier](#notifier)
9. [Example: WebChat Component](#example-webchat-component)


## Overview

The RWS Frontend Framework is designed to create dynamic and responsive web applications. It integrates seamlessly with the backend and provides a robust set of tools for developing comprehensive web solutions.

## Getting Started

To get started with the RWS Frontend Framework, ensure you have the necessary environment set up, including Node.js and any other dependencies specific to the framework.

from your project dir do:

```bash
yarn
```

to install once and then to build:

```bash
yarn build
```
or to watch for dev

```bash
yarn watch
```

## Key Components

### RWSClient
##
`RWSClient` is the heart of the framework, managing configuration and initialization. It sets up routes, backend connections, and other essential framework services.


### RoutingService
##
`RoutingService` handles the navigation and routing within your application. It ensures that URL changes reflect the correct component rendering.

Implementing the Framework

**Main File:**

The main file (`index.ts`) is where you initialize the RWSClient. Here, you configure your routes, backend routes, and component initializations.

```typescript
import IRWSConfig from './interfaces/IRWSConfig';
import startClient from './run';
import RWSNotify, { NotifyUiType, NotifyLogType } from './types/RWSNotify';
import { observable, attr } from '@microsoft/fast-element';
import NotifyService from './services/NotifyService';
import RoutingService, { IFrontRoutes, renderRouteComponent, RouteReturn, _ROUTING_EVENT_NAME, IRoutingEvent } from './services/RoutingService';
import DOMService, { DOMOutputType }  from './services/DOMService';
import RWSViewComponent from './components/_component';
import RWSView from './components/_decorator';
import ApiService, { IBackendRoute } from './services/ApiService';
import RWSService from './services/_service';
import WSService from './services/WSService';
import { RouterComponent } from './components/router/component';
import registerRWSComponents from './components/index';

interface IHotModule extends NodeModule {
    hot?: {
        accept(dependencies: string[], callback?: (updatedDependencies: string[]) => void): void;
        accept(dependency: string, callback?: () => void): void;
        accept(errHandler?: (err: Error) => void): void;
        dispose(callback: (data: any) => void): void;
    }
}

class RWSClient {   
    private config: IRWSConfig = { backendUrl: '', routes: {} };
    protected initCallback: () => Promise<void> = async () => {};

    async start(config: IRWSConfig): Promise<boolean> {    
        this.config = {...this.config, ...config};                                 

        const hotModule:IHotModule = (module as IHotModule);

        if (hotModule.hot) {
            hotModule.hot.accept('./print.js', function() {
              console.log('Accepting the updated module!');              
            })
        }

        const packageInfo = "";
        
        await startClient(this.config);
        
        if(!this.config.ignoreRWSComponents){
            registerRWSComponents();
        }
        
        await this.initCallback();
    
        return true;
    }

    public addRoutes(routes: IFrontRoutes){
        this.config.routes = routes;
    }

    public setNotifier(notifier: RWSNotify)
    {
        NotifyService.setNotifier(notifier);
    }

    public setDefaultLayout(DefaultLayout: any) {
        this.config.defaultLayout = DefaultLayout;
    }

    public setBackendRoutes(routes: IBackendRoute[]) {
        this.config.backendRoutes = routes;            
    }

    public async onInit(callback: () => Promise<void>): Promise<void>
    {
        this.initCallback = callback;
    }

    private enableRouting(): void
    {
        
    }
}

export default RWSClient;
export { 
    NotifyUiType,
    NotifyLogType,

    RouteReturn,
    _ROUTING_EVENT_NAME, NotifyService,
    IRoutingEvent,

    ApiService,    
    WSService,
    RoutingService,
    DOMService,
    DOMOutputType,

    RWSViewComponent,        
    RWSView,
    RWSService,
    RouterComponent,

    renderRouteComponent,
    registerRWSComponents,

    observable,
    attr 
}
```

## Component Initialization

In `application/_initComponents.ts`, you initialize the custom components used in your application. If components added in here will include other components they dont need to be listed here. A component imported in this mode needs to be imported once.

### Default component structure

```
component-dir/
    component.ts
    template.html
    styles/
        layout.scss
```

**WARNING** *All html templates refer to variable "T" as to FASTElement templating html scope. It contains all the functions FAST templates uses in html. F.e:* **T.html**, **T.when**, **T.repeat**

```html
<div class="convo-area-wrap">
    <header>  
        <div class="header-inner"></div>      
        ${T.when(x => x.noChoose === 'false',  (item, index) => T.html`<div>
            <chat-convo-models :chosenModel="${x => x.chosenModel}"></chat-convo-models>
        </div>`)}
        <div>
            <h2>${ x => x.chatContext ? x.chatContext.label : 'loading...' }</h2>
            <h3><strong>${ x => x.messageList.length }</strong> messages in total</h3>
        </div>   
        <fast-divider></fast-divider>             
    </header>
    <section>
        <div class="scroll-area">
            <div class="scroll-content">
                ${T.repeat(x => x.messageList,  (item, index) => T.html`
                    <chat-convo-message :contentReturn="${item => item}" :item="${item => item}"/>
                `)}      
                
                ${T.when(x => !x.messageList.length,  (item, index) => T.html`
                    <p class="no-chat">No messages</p>
                `)}   
            </div>
        </div>
    </section>  

</div>
```

### application/_initComponents.ts

```typescript
import { ChatNav } from '../components/chat-nav/component';
import { DefaultLayout } from '../components/default-layout/component';
import { RWSIcon } from '../components/rws-icon/component';
import { Loader } from '../components/loader/component';
import { LineSplitter } from '../components/line-splitter/component';

import { registerRWSComponents } from 'rws-js-client';

export default () => {
    LineSplitter;
    DefaultLayout;
    ChatNav;
    RWSIcon;
    Loader;
    registerRWSComponents(); //register rws components like <upload-area> and other comfy components
}

```

```typescript
//index.ts

 const theClient = new RWSClient();

    
    theClient.addRoutes(routes);    //routes are optional
    
    theClient.onInit(async () => {
        initComponents(); //user components from _initComponents.ts
        provideFASTDesignSystem().register(allComponents); // @microsoft/fast-components ready components init
    });    

```

**Component needs to extend RWSViewComponent and use @RWSView decorator**:

```typescript
import { RWSViewComponent,  RWSView, observable, attr } from 'rws-js-client';

const options?: RWSDecoratorOptions;

@RWSView('tag-name', options)
class WebChat extends RWSViewComponent {  
```

The decorator options type:

```typescript
interface RWSDecoratorOptions{
    template?: string, //relative path to HTML template file (default: ./template.html)
    styles?: string //relative path to SCSS file (./styles/layout.scss)
    fastElementOptions?: any //the stuff you would insert into static definition in FASTElement class.
}
```

## Frontend routes

if you are passing routes this is example routing file for frontend:

```typescript
export default {
    '/': renderRouteComponent('Home page', WebChat),    
    '/the/path': renderRouteComponent('Component title', ComponentClassName),   
}
```

## Backend Imports

`backendImports.ts` consolidates various backend interfaces, routes, and models, allowing for a synchronized frontend and backend.

```typescript
import IBook from '../../backend/src/models/interfaces/IBook';

import { 
    IBookInfo,  
  } from '../../backend/src/interfaces/IBookInfo';

import backendRoutes from '../../backend/src/routing/routes';

export { 
    IBook,
    IBookInfo,
    backendRoutes
}

```

usage:


```typescript
    import { backendRoutes} from '../../backendImport';

    //index.ts
    const theClient = new RWSClient();
    theClient.setBackendRoutes(backendRoutes());

```


## Utilizing APIService

`APIService` is used for making HTTP requests to the backend. It simplifies the process of interacting with your API endpoints.

after control method we have dynamic types those are: <**ResponseType**, **PayloadType**>

Example Usage by controller route

```typescript
  const apiPromise: Promise<ITalkApiResponse> = ApiService.back.post<ITalkApiResponse, IApiTalkPayload>('talk:models:prompt', {        
        message: msg,
        model: this.chosenModel,
      });
```

Example Usage by url

```typescript
  const apiPromise: Promise<ITalkApiResponse> = ApiService.post<ITalkApiResponse, IApiTalkPayload>('/api/path/to/action', {        
        message: msg,
        model: this.chosenModel,
      });
```

## Notifier

### Overview

The Notifier feature in the RWS Client is a versatile tool for handling notifications within the application. It allows for different types of user interface interactions like alerts, notifications, and silent logging, with varying levels of visibility and user interaction.
Usage

### Setting the Notifier

```typescript
theClient.setNotifier((message: string, logType: NotifyLogType, uiType: NotifyUiType = 'notification', onConfirm: (params: any) => void) => {
    // Implementation based on uiType
});

```

This function allows setting a custom notifier in the RWS Client. It handles the logic based on `uiType`.

Alert, Notify, and Silent

- alert: Displays an alert dialog with the message.
- notify: Shows a notification with the message.
- silent: Silently logs the message to the console.

Each method can be configured with a `message`, `logType`, and an optional `onConfirm` callback function.

Note

Ensure that a notifier is set in the RWS Client to use the `NotifyService` effectively. If no notifier is set, it will default to a warning in the console.

## Example: WebChat Component

The WebChat component demonstrates a practical use of `APIService` in a real-world scenario. It shows how to send and receive data from the backend.

### WebChat Component Implementation

```typescript
import { RWSViewComponent, ApiService, NotifyService, RWSView, WSService } from 'rws-js-client';
import { observable, css  } from '@microsoft/fast-element';

import './children/convo-footer/component';

import WebChatEvents from './events';
import { IContext } from './children/left-bar/component';
import { IMessage } from '../chat-message/component';
import { ITalkApiResponse, BedrockBaseModel, IHyperParameter, 

@RWSView('web-chat')
class WebChat extends RWSViewComponent {  

  @observable chatContext: IContext = null;
  @observable chosenModel: BedrockBaseModel = null;
  @observable injectMessages: IMessage[] = [];
  @observable hyperParameters: { key: string, value: any }[] = [];

  connectedCallback() {
    super.connectedCallback();
    
    this.on<{ item: IContext }>(WebChatEvents.item.click, (event: CustomEvent<{ item: IContext }>) => {           
      this.chatContext = event.detail.item;      
    });  

    this.on<{ item: BedrockBaseModel }>(WebChatEvents.model.set, (event: CustomEvent<{ item: BedrockBaseModel }>) => {
      if(!event.detail.item){
        this.chosenModel = null;
        return;
      }      

      this.chosenModel = {...event.detail.item};    

      this.setupModel();
    });  

    if(!this.chosenModel){
      this.chosenModel = ClaudeModel;
      this.setupModel();
    }

    this.on<{ item: IMessage }>(WebChatEvents.message.send, (event: CustomEvent<{ item: IMessage }>) => {          
      this.injectMessages = [event.detail.item];      
      // this.callStreamApi(event.detail.item);
      this.callTalkApi(event.detail.item);
    });    
   
  }  
  setupModel() {
    // other code
  }

  setHyperParam(key: string, value: any): void
  {
   // other code
  }

  
    
    this.hyperParameters = [
      ...this.hyperParameters,
      {
        key,
        value
      }
    ];
  }

  private getDefaultParams(provider: string | null)
  {
   // other code
  }


  private async callTalkApi(msg: IMessage): Promise<void>
  {

    type IApiTalkPayload = {
      message: IMessage;
      model: any;
    }    

    try {
      const apiPromise: Promise<ITalkApiResponse> = ApiService.back.post<ITalkApiResponse, IApiTalkPayload>('talk:models:prompt', {        
        message: msg,
        model: this.chosenModel,
      });
      
      this.injectMessages = [msg, {
        _promise: apiPromise,
        me: false,
        author: this.chosenModel.modelName, 
        content: null,
        model: this.chosenModel,
        created_at: new Date()
      }];        

    } catch(e: Error | any) {
      console.error(e);
    }      
  }

  private async callStreamApi(msg: IMessage): Promise<void>
  {

    type IApiTalkPayload = {
      message: IMessage;
      model: any;
    }    

    const llmStream = new ReadableStream();

    const sendMsg: IMessage = {       
      me: false,
      author: this.chosenModel.modelName, 
      content: null,
      model: this.chosenModel,
      created_at: new Date()
    };   

    WSService.sendMessage('send_msg', {
      modelId: this.chosenModel.modelId,
      prompt: msg.content
    });

    try {      
      this.injectMessages = [msg, {          
          ...sendMsg,
          _stream: llmStream,
        }];        

    } catch(e: Error | any) {
      console.error(e);
    }      
  }
}

WebChat.defineComponent();


export { WebChat }

```

### Controller route

The route ApiService.back.get|post|put|delete methods can be found in backend controllers:

```typescript
 @Route('talk:models:prompt', 'POST')
    public async modelTalkAction(params: IRequestParams): Promise<ITalkApiResponse>
    {
        // (...)
    }       
```

and src/config/config

```typescript
    const http_routes = [    
        {
            prefix: '/prefix',
            routes: [
                {
                    name: 'action:route:name',
                    path: '/path/to/action'
                },
                 {
                    name: 'action:route:name',
                    path: '/path/to/action'
                }       
            ]
        },        
        {
            name: 'home:index',
            path: '/*', //if no routes detected pass request to frontend
            noParams: true, //do not read params from the request leave it to the front
        },       
    ]
```

### Socket route

Socket route from

```typescript
 WSService.sendMessage('send_msg', {
      modelId: this.chosenModel.modelId,
      prompt: msg.content
    });

```

are defined in backend/src/config/config

```typescript
    const ws_routes = {
        'send_msg' : ChatSocket,
        'process_book' : TrainSocket,
    }
```

