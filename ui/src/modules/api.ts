import axios, { AxiosRequestConfig } from 'axios'
import { computed, ref } from 'vue'
import { useAuth, AUTH_TOKEN } from './auth'


export const useApiWithAuth = (endpoint: string) => {
  const { user } = useAuth()

  return useApi(endpoint, user?.value ? user.value[ AUTH_TOKEN ] : undefined)
}

export const useApi = (endpoint: string, access_token?: string) => {
  const api = axios.create({
    baseURL: 'http://localhost:3000/',
    headers: {
      Authorization: access_token ? `Bearer ${access_token}` : undefined,
    }
  })

  const data = ref()
  const loading = ref(false)
  const error = ref()

  const post = (payload?: Record<string, any>) => {
    loading.value = true
    error.value = undefined

    return api.post(endpoint, payload)
      .then(res => data.value = res.data)
      .catch(e => {
        error.value = e

        throw e
      })
      .finally(() => loading.value = false)
  }

  const get = (query?: Record<string, any>, config?: AxiosRequestConfig) => {
    loading.value = true
    error.value = undefined

    let queryString = ''

    if ( query ) {
      queryString = '?' + Object.entries(query)
        .map(([ key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    }

    return api.get(endpoint + queryString, config)
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
