import axios, { AxiosRequestConfig } from 'axios'
import { computed, ref } from 'vue'


const config = (access_token?: string): AxiosRequestConfig => {
  const config: AxiosRequestConfig = {}

  if ( access_token ) config.headers = {
    Authorization: `Bearer ${access_token}`
  }

  return config
}

export const useApi = (endpoint: string) => {
  const api = axios.create({
    baseURL: 'http://localhost:3000/'
  })

  const data = ref()
  const loading = ref(false)
  const error = ref()

  const post = (payload?: Record<string, any>, access_token?: string) => {
    loading.value = true
    error.value = undefined

    return api.post(endpoint, payload, config(access_token))
      .then(res => data.value = res.data)
      .catch(e => {
        error.value = e

        throw e
      })
      .finally(() => loading.value = false)
  }

  const get = (query?: Record<string, any>, access_token?: string) => {
    loading.value = true
    error.value = undefined

    let queryString = ''

    if ( query ) {
      queryString = '?' + Object.entries(query)
        .map(([ key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    }


    return api.get(endpoint + queryString, config(access_token))
      .then(res => data.value = res.data)
      .catch(e => {
        error.value = e

        throw e
      })
      .finally(() => loading.value = false)
  }

  const errorMessage = computed(() => {
    if (error.value) {
      return error.value.message
    }
  })

  const errorDetails = computed(() => {
    if ( error.value && error.value.response ) {
      return error.value.response.data.message
    }
  })

  const errorFields = computed(() => {
    if (error.value && Array.isArray(error.value.response.data.message)) {

      return (error.value.response.data.message as string[]).reduce((acc: Record<string, any>, msg: string) => {
        let [ field ] = msg.split(' ')

        // TODO: Maximal...
        if (field == 'maximal') field = 'dateOfBirth'

        if (!acc[field]) {
          acc[field] = []
        }

        acc[field].push(msg)

        return acc
      }, {})
    }
  })

  const computedClasses = (key: string) => {
    if ( errorFields.value?.hasOwnProperty(key) ) {
      return ['border-red-600', 'bg-red-200', 'text-red-900']

    }
    return ['border-grey-600', 'bg-white', 'text-gray-900']
  }

  return {
    loading,
    data,
    error,
    get,
    post,
    errorMessage,
    errorDetails,
    errorFields,
    computedClasses,
  }
}

// export default api
