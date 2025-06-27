# @rws-framework/client

This package provides the core client-side framework for Realtime Web Suit (RWS), enabling modular, asynchronous web components, state management, and integration with backend services. It is located in `.dev/client`.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Key Concepts](#key-concepts)
4. [Component Initialization](#component-initialization)
5. [Dependency Injection](#dependency-injection)
6. [Frontend Routes](#frontend-routes)
7. [Backend Imports](#backend-imports)
8. [Utilizing APIService](#utilizing-apiservice)
9. [Notifier](#notifier)
10. [Service Worker](#service-worker)
11. [Example: WebChat Component](#example-webchat-component)
12. [Other configs](#other-configs)
13. [Plugin System](#plugin-system)
14. [Nest Interconnectors](#nest-interconnectors)
15. [Styles Injection](#styles-injection)
16. [Links](#links)

## Overview

`@rws-framework/client` is the heart of the RWS frontend framework. It manages configuration, plugin management, service registration, application lifecycle, and provides the base for all RWSView components. It is designed for modular, fullstack-oriented web applications using the RWS/FAST paradigm.

### Main Features
- **RWSClient**: Main entry point for the frontend application. Handles configuration, plugin management, service registration, and application lifecycle.
- **Dependency Injection**: Uses a DI container for services and components.
- **Component Registration**: Supports modular component definition and registration.
- **Plugin System**: Add plugins for routing, websockets, and more.
- **Notifier**: Customizable notification system for UI messages.
- **Service Worker Integration**: Pushes config and user data to service workers.
- **User and Config Management**: Handles user state and application configuration.
- **API Service**: Integrates with backend API routes and authentication.

## Getting Started

Install dependencies and initialize the project:

```bash
yarn
rws-client init
yarn build # or yarn watch for dev
yarn server # to just start server
```

Start the engine in your site JavaScript:

```javascript
window.RWS.client.start(CFG); // async function
```

Or for initial setup on an event:

```javascript
window.RWS.client.setup(CFG).then(() => {
    $.on('loaded', function(data){
        const optionalNewCfg = { backendRoutes: data.backendRoutes };
        window.RWSClient.start(optionalNewCfg).then();
    })    
});
```

### Default config for RWS

```javascript
const _DEFAULT_CONFIG_VARS = {
    dev: false,
    hot: false,
    report: false,   
    publicDir: './public',
    publicIndex: 'index.html',      
    outputFileName: 'client.rws.js',
    outputDir: process.cwd() + '/build',
    backendUrl: null,
    wsUrl: null,
    partedDirUrlPrefix: '/lib/rws',
    partedPrefix: 'rws',
    pubUrlFilePrefix: '/',
    parted: false,        
}
```

*See the table in the original README for all config options.*

## Key Concepts

### RWSClient
`RWSClient` is the main class, instantiated and managed via DI. It manages configuration, plugins, services, and the application lifecycle.

#### Example Usage

```typescript
import RWSClient, { RWSClientInstance } from '@rws-framework/client';

const theClient: RWSClientInstance = RWSContainer().get(RWSClient);

theClient.addPlugin(RWSBrowserRouter);
theClient.addPlugin(RWSWebsocketsPlugin, { enabled: true });

theClient.assignClientToBrowser();

theClient.onInit(async () => {
    // Register components, routes, etc.
});

theClient.setNotifier((message, logType) => {
    // Custom notification logic
});

theClient.start({
    backendRoutes,
    backendUrl: process.env.BACKEND_URL,
    wsUrl: process.env.WS_URL,
    hot: true,
    parted: false
});
```

### Component Registration

- Components must extend `RWSViewComponent` and use the `@RWSView` decorator.
- Structure: `component-dir/component.ts`, `template.html`, `styles/layout.scss`
- See RWSDocs for more details.

### Plugin System

- Add plugins via `addPlugin` (e.g., routing, websockets).
- Plugins are initialized on client startup.

### Notifier

Set a custom notification handler with `setNotifier`:

```typescript
theClient.setNotifier((message: string, logType: NotifyLogType, uiType: NotifyUiType = 'notification', onConfirm: (params: any) => void) => {
    // Implementation based on uiType
});
```

### Service Worker

If you pass `{serviceWorker: 'service_worker_class_path.ts'}` to the RWS Webpack wrapper, the code will build a ServiceWorker to pubDir.

## Dependency Injection

All services and components are registered and resolved via a DI container. Default and custom services can be injected and used throughout your app.

## Frontend Routes

Define frontend routes using `renderRouteComponent` and pass them to the router plugin. Example route definitions for use with the router component (see `.dev/router`):

```typescript
import { renderRouteComponent } from '@rws-framework/browser-router';
import { HomePage } from './pages/home/component';
import { CompanyList } from './pages/company/list/component';
import { GeneralSettings } from './pages/settings/general/component';

export const frontRoutes = [
    {
        path: '/',
        name: 'Home',
        component: HomePage,
        icon: 'home',
        inMenu: true
    },
    {
        path: '/company/list',
        name: 'Companies',
        component: CompanyList,
        icon: 'company',
        inMenu: true
    },
    {
        path: '/settings/general',
        name: 'Settings',
        component: GeneralSettings,
        icon: 'settings',
        inMenu: true
    }
];

// Convert to route map for the router
const routeMap = {};
for (const route of frontRoutes) {
    routeMap[route.path] = renderRouteComponent(route.name, route.component);
}

export default routeMap;
```

- Each route object can include `path`, `name`, `component`, `icon`, and `inMenu` fields.
- Use `renderRouteComponent` to wrap the component for the router.
- Pass the resulting `routeMap` to the router plugin or RWS client configuration.

## Backend Imports

`backendImport.ts` consolidates backend interfaces, routes, and models for synchronized frontend/backend development.

### HTTPRoutes Interface

The RWS client uses a typed interface for backend HTTP routes, typically called `IBackendRoute` or `HTTPRoutes`. This interface defines the structure for backend API endpoints, allowing for type-safe integration between frontend and backend. You can import and use these routes as follows:

```typescript
import { backendRoutes } from './backendImport';

theClient.setBackendRoutes(backendRoutes);
```

- Each route entry in `backendRoutes` should conform to the `IBackendRoute` (or `HTTPRoutes`) interface, describing the HTTP method, path, and any metadata required for API calls.
- This enables strong typing and autocompletion for API requests throughout your frontend codebase.

## Utilizing APIService

`APIService` is used for making HTTP requests to the backend. It supports dynamic types for response and payload, and can be accessed via DI or through the RWS client instance.

### Basic Usage

```typescript
// Injected in a component or service
@RWSInject(ApiService, true) protected apiService: ApiServiceInstance;

// Or via the client
const apiService = window.RWS.client.get('ApiService');
```

### Making Requests

You can use RESTful methods directly:

```typescript
// GET request
apiService.get('/api/some-endpoint');

// POST request with payload
type MyResponse = { ... };
type MyPayload = { ... };
const result = await apiService.post<MyResponse, MyPayload>('/api/some-endpoint', { foo: 'bar' });
```

### Using Named Backend Routes

If you use named backend routes (from `backendRoutes`):

```typescript
// By route name (controller:action)
const data = await apiService.back.get<MyResponse>('user:getProfile', { routeParams: { id: '123' } });

// POST with payload
type Payload = { name: string };
const result = await apiService.back.post<MyResponse, Payload>('user:updateProfile', { name: 'John' });
```

### File Upload Example

```typescript
await apiService.uploadFile('/api/upload', file, progress => {
    console.log('Progress:', progress);
});
```

### Route Type Safety

If you use `IBackendRoute`/`HTTPRoutes` for your backend route definitions, you get type safety and autocompletion for all API calls.

## Example: WebChat Component

See the WebChat component for a practical example of APIService and RWSView usage.

## Other configs

See the original README for example `tsconfig.json` and webpack config.

## Plugin System

The plugin system allows you to extend the client with additional features. For example, you can add routing with `@rws-framework/browser-router` or websockets with `@rws-framework/nest-interconnectors`.

## Nest Interconnectors

The `@rws-framework/nest-interconnectors` package provides seamless integration with NestJS-based backend websockets and real-time features. You can add the plugin as follows:

```typescript
import { RWSWebsocketsPlugin, WSOptions } from '@rws-framework/nest-interconnectors';

theClient.addPlugin<WSOptions>(RWSWebsocketsPlugin, {
    enabled: true,
    auto_notify: true
});
```

This enables real-time communication and event-driven features between your RWS frontend and a NestJS backend.

## Styles Injection

RWS supports advanced styles injection for components. You can inject global or component-specific stylesheets using the static method:

```typescript
RWSViewComponent.injectStyles(["/css/global.css", "/css/theme.css"]);
```

- Styles can be injected in `adopted`, `legacy`, or `both` modes (default is `adopted`).
- Styles are cached in IndexedDB for performance and can be hot-reloaded.
- Each component can also inject its own styles via the `injectStyles` method or by specifying styles in the component definition.

This allows for efficient, encapsulated, and dynamic styling of your RWS components, supporting both modern and legacy browsers.

## Links
- [RWSDocs instructions](../../.github/instructions/RWSDocs.instructions.md)
- [FAST documentation](https://www.fast.design/docs/fast-element/getting-started)
- [WebComponents.org](https://www.webcomponents.org)