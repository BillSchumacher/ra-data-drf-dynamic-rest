import { stringify } from 'query-string';
import {
  fetchUtils,
  DataProvider,
  FilterPayload,
  Identifier,
  PaginationPayload,
  SortPayload,
  GetListResult,
} from 'ra-core';
import { singularize, pluralize } from 'inflection';

export {
  default as tokenAuthProvider,
  fetchJsonWithAuthToken,
} from './tokenAuthProvider';

export {
  default as jwtTokenAuthProvider,
  fetchJsonWithAuthJWTToken,
} from './jwtTokenAuthProvider';

const getPaginationQuery = (pagination: PaginationPayload) => {
  return {
    page: pagination.page,
    page_size: pagination.perPage,
  };
};

const getFilterQuery = (filter: FilterPayload) => {
  const { q: search, ...otherSearchParams } = filter;
  return {
    ...otherSearchParams,
    search,
  };
};

export const getOrderingQuery = (sort: SortPayload) => {
  const { field, order } = sort;
  return {
    'sort[]': `${order === 'ASC' ? '' : '-'}${field}`,
  };
};

const getData = (json: any, resource: string) => {
  const singular_resource = singularize(resource);
  const plural_resource = pluralize(resource);
  let data = json;
  if (json.results) {
    data = json.results;
  }
  if (data.hasOwnProperty(singular_resource)) {
    return data[singular_resource];
  } else if (data.hasOwnProperty(plural_resource)) {
    return data[plural_resource];
  }
  return null;
};

const getPaginationData = (json: any) => {
  const hasMeta = json.meta !== undefined;
  return {
    total: json.results
      ? json.count > 0
        ? json.count
        : -1
      : json.meta
      ? json.meta['total_results']
      : null,
    pageInfo: {
      hasNextPage: json.results
        ? json.next != null
        : hasMeta
        ? json.meta.page < json.meta['total_pages']
        : false,
      hasPreviousPage: json.results
        ? json.previous != null
        : hasMeta
        ? json.meta['total_pages'] - json.meta.page > 0
        : false,
    },
  };
};

export default function dataProvider(
  apiUrl: String,
  httpClient: Function = fetchUtils.fetchJson
): DataProvider {
  const getOneJson = (resource: String, id: Identifier) =>
    httpClient(`${apiUrl}/${resource}/${id}/`).then(
      (response: Response) => response.json
    );

  return {
    getList: async (resource, params): Promise<GetListResult<any>> => {
      const query = {
        ...getFilterQuery(params.filter),
        ...getPaginationQuery(params.pagination),
        ...getOrderingQuery(params.sort),
      };
      const url = `${apiUrl}/${resource}/?${stringify(query)}`;
      const { json } = await httpClient(url);
      return {
        data: getData(json, resource),
        ...getPaginationData(json),
      };
    },

    getOne: async (resource, params) => {
      const data = await getOneJson(resource, params.id);
      return {
        data: getData(data, resource),
      };
    },

    getMany: async (resource, params) => {
      const results = await Promise.all(
        params.ids.map(id => getOneJson(resource, id))
      );
      const data = results.map((json: any) => getData(json, resource));
      return { data };
    },

    getManyReference: async (resource, params) => {
      const query = {
        ...getFilterQuery(params.filter),
        ...getPaginationQuery(params.pagination),
        ...getOrderingQuery(params.sort),
        [params.target]: params.id,
      };
      const url = `${apiUrl}/${resource}/?${stringify(query)}`;
      const { json } = await httpClient(url);
      return {
        data: getData(json, resource),
        ...getPaginationData(json),
      };
    },

    update: async (resource, params) => {
      const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(params.data),
      });
      return { data: getData(json, resource) };
    },

    updateMany: (resource, params) =>
      Promise.all(
        params.ids.map(id =>
          httpClient(`${apiUrl}/${resource}/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(params.data),
          })
        )
      ).then(responses => ({ data: responses.map(({ json }) => json.id) })),

    create: async (resource, params) => {
      const { json } = await httpClient(`${apiUrl}/${resource}/`, {
        method: 'POST',
        body: JSON.stringify(params.data),
      });
      return {
        data: { ...getData(json, resource) },
      };
    },

    delete: (resource, params) =>
      httpClient(`${apiUrl}/${resource}/${params.id}/`, {
        method: 'DELETE',
      }).then(() => ({ data: params.previousData })),

    deleteMany: (resource, params) =>
      Promise.all(
        params.ids.map(id =>
          httpClient(`${apiUrl}/${resource}/${id}/`, {
            method: 'DELETE',
          })
        )
      ).then(() => ({ data: [] })),
  };
}
