# ra-data-drf-dynamic-rest

Some of the info here is pretty outdated, personally I would recommend using JWT authentication with this library, the token auth is neglected and not tested.

As I have more time I'll update the examples and the documentation.

Original project:
https://github.com/bmihelac/ra-data-django-rest-framework

This project's goal is to be able to use dynamic-rest. (Tested against https://github.com/BillSchumacher/dynamic-rest, installed as `dynamic-rest-bse`)

[react-admin](https://marmelab.com/react-admin/) data and authentication provider for [Django REST
framework](https://www.django-rest-framework.org/).

[![Stable Release](https://img.shields.io/npm/v/ra-data-django-rest-framework)](https://npm.im/ra-data-django-rest-framework)
[![license](https://badgen.now.sh/badge/license/MIT)](./LICENSE)
![CI](https://github.com/bmihelac/ra-data-django-rest-framework/workflows/CI/badge.svg)
[![codecov](https://codecov.io/gh/bmihelac/ra-data-django-rest-framework/branch/master/graph/badge.svg)](https://codecov.io/gh/bmihelac/ra-data-django-rest-framework)

ra-data-django-rest-framework includes backend and client example application
and tests.

<p align="center">
  <img src="https://github.com/BillSchumacher/ra-data-drf-dynamic-rest/blob/master/docs/ra-data-django-rest-framework.png" alt="ra-data-django-rest-framework" />
</p>

## Install

```bash
npm install ra-data-drf-dynamic-rest
```

## Usage

```javascript
import drfProvider from 'ra-data-drf-dynamic-rest';
const dataProvider = drfProvider("/api");
```

## Features

* Sorting
* Pagination
* Filtering
* Authentication

### Sorting

Ordering for
[OrderingFilter](https://www.django-rest-framework.org/api-guide/filtering/#orderingfilter)
is supported.

### Pagination

Currently pagination with
[PageNumberPagination](https://www.django-rest-framework.org/api-guide/pagination/#pagenumberpagination)
is supported.

Default `PageNumberPagination` has `page_size_query_param` set to `None`,
overide to be able to set *Rows per page*, ie:

```python
from rest_framework.pagination import PageNumberPagination


class PageNumberWithPageSizePagination(PageNumberPagination):
    page_size_query_param = 'page_size'
```

### Filtering

ra-data-drf-dynamic-rest supports:

* [Generic Filtering](https://www.django-rest-framework.org/api-guide/filtering/#generic-filtering)
* [DjangoFilterBackend](https://www.django-rest-framework.org/api-guide/filtering/#djangofilterbackend)

### Authentication

#### tokenAuthProvider

`tokenAuthProvider` uses
[TokenAuthentication](https://www.django-rest-framework.org/api-guide/authentication/#tokenauthentication)
to obtain token from django-rest-framework. User token is saved in `localStorage`.

`tokenAuthProvider` accepts options as second argument with
`obtainAuthTokenUrl` key. Default URL for obtaining a token is `/api-token-auth/`.

`fetchJsonWithAuthToken` overrides *httpClient* and adds authorization header
with previously saved user token to every request.

```javascrtipt
import drfProvider, { tokenAuthProvider, fetchJsonWithAuthToken } from 'ra-data-django-rest-framework';

const authProvider = tokenAuthProvider()
const dataProvider = drfProvider("/api", fetchJsonWithAuthToken);
```

#### jwtTokenAuthProvider

`jwtTokenAuthProvider` uses
[JSON Web Token Authentication](https://www.django-rest-framework.org/api-guide/authentication/#json-web-token-authentication)
to obtain token from django-rest-framework. User token is saved in `sessionStorage`.

`jwtTokenAuthProvider` accepts options as arguments:

`obtainAuthJWTTokenUrl` -  Default URL for obtaining a token is `/api/token/`

`refreshTokenUrl` - Default URL for refreshing an access token is `/api/token/refresh/`

`fetchJsonWithAuthJWTToken` overrides *httpClient* and adds authorization header
with previously saved user token to every request.

For the refresh token to work properly, you need to use `addRefreshTokenToAuthProvider` and `addRefreshTokenToDataProvider`.

To keep things organized, create an authProvider.js file and populate it like so:

```javascript
import { addRefreshAuthToAuthProvider } from 'react-admin';
import { jwtTokenAuthProvider } from "ra-data-drf-dynamic-rest";

const API_BASE_URL = 'http://localhost:8000';

const jwtAuthProvider = jwtTokenAuthProvider({
    obtainAuthTokenUrl: `${API_BASE_URL}/api/token/` ,
    refreshTokenUrl: `${API_BASE_URL}/api/token/refresh/`,
});

export const getAuthTokensFromSessionStorage = () => {
       const access = sessionStorage.getItem('access');
       const refresh = sessionStorage.getItem('refresh');
       return {access, refresh};
}

function parseJwt (token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}
export const refreshAuth = () => {
    const { access, refresh } = getAuthTokensFromSessionStorage();
    const now = new Date();
    const claims = parseJwt(access);
    if (claims.exp < now.getTime() / 1000 && refresh) {
        return jwtAuthProvider.refreshAccessToken();
    }
    return Promise.resolve();
}

export const authProvider = addRefreshAuthToAuthProvider(jwtAuthProvider, refreshAuth);
```

Then, in your App.js file, setup the dataProvider like so:

```javascript
import drfProvider, { fetchJsonWithAuthJWTToken } from 'ra-data-drf-dynamic-rest';
import { authProvider, refreshAuth } from "./authProvider";

const authProvider = jwtTokenAuthProvider()
const dataProvider = drfProvider("/api", fetchJsonWithAuthJWTToken);

const API_BASE_URL = 'http://localhost:8000';


const dataProvider : DataProvider = addRefreshAuthToDataProvider(drfProvider(`${API_BASE_URL}/api`, fetchJsonWithAuthJWTToken), refreshAuth)

export const App = () => <Admin dataProvider={dataProvider} authProvider={authProvider}>
        ...
    </Admin>
```

You probably want to do something a bit better with your API_BASE_URL...

## Example app

### Django application with django-rest-framework

Setup virtual environment, install requirements and load initial data:

```bash
cd example/backend
virtualenv .venv
source .venv/bin/activate
pip install -r requirements.txt
./manage.py migrate
./manage.py loaddata initial
```

Run server:

```bash
./manage.py runserver
```

This Django app allows CORS from all origins this is not recommended in production.

Admin credentials in the example app are:

`admin`
`password`

### React-admin demo application

```bash
yarn install # install ra-data-django-rest-framework
cd example/client
yarn install
yarn start
```

You can now view example app in the browser: http://localhost:3000
Login with user `admin`, password is `password` or create new users in Django
admin dashboard or shell.

By default the ``rest_framework.authentication.TokenAuthentication`` will be 
used. To use ``rest_framework_simplejwt.authentication.JWTAuthentication``, set
the value of the ``REACT_APP_USE_JWT_AUTH`` variable in the .env 
file (example/client/.env) to true, as shown below:

```text
REACT_APP_USE_JWT_AUTH=true
```

## Contributing

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).
All features that TSDX provides should work here too.

```bash
yarn start
```

```bash
yarn test
```

## TODO

* examples for image upload
