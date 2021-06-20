import { ApolloClient, InMemoryCache, gql } from '@apollo/client'
import { SUBGRAPH_EVENT_FIELDS, EVENT_QUERIES } from '../config/constants'
import { HOME_SUBGRAPH_URL, FOREIGN_SUBGRAPH_URL } from '../config/constants'

const getSubgraph = (uri: string) => {
  return new ApolloClient({
    uri,
    cache: new InMemoryCache()
  })
}

// https://stackoverflow.com/questions/11233498/json-stringify-without-quotes-on-properties
function stringify(obj_from_json: any): string {
  if (typeof obj_from_json !== 'object' || Array.isArray(obj_from_json)) {
    // not an object, stringify using native function
    return JSON.stringify(obj_from_json)
  }
  // Implements recursive object serialization according to JSON spec
  // but without quotes around the keys.
  let props = Object.keys(obj_from_json)
    .map(key => `${key}:${stringify(obj_from_json[key])}`)
    .join(',')
  return `{${props}}`
}

const makeEventQuery = (eventName: string, where: any = {}, toBlock?: number) => {
  // return graphQL query as string
  const ret = `{
	${eventName}(where:${stringify(where)}${
    typeof toBlock === 'undefined' ? '' : ', block:' + stringify({ number: toBlock })
  }){
		${SUBGRAPH_EVENT_FIELDS[eventName].join('\n')}
	}}
	`
  return ret
}

export const gqlQuery = async (uri: string, eventName: string, where: any = {}, toBlock?: number) => {
  const client = getSubgraph(uri)
  eventName = EVENT_QUERIES[eventName]
  const ret = await client.query({
    query: gql(makeEventQuery(eventName, where, toBlock))
  })
  return ret['data'][eventName].map((e: any) => {
    return { returnValues: e }
  })
}

export const usingSubgraph = (isHome: boolean): boolean => {
  return (isHome && HOME_SUBGRAPH_URL !== '') || (!isHome && FOREIGN_SUBGRAPH_URL !== '')
}
