// import api from './api'
import { inject, reactive, toRefs, watch } from 'vue'
import { useApi } from './api'

const AUTH_KEY = 'neoflix_token'
const AUTH_TOKEN = 'access_token'

interface User {
    id: string;
    email: string;
    dateOfBirth: Date;
    firstName: string;
    lastName: string;
    [ AUTH_TOKEN ]: string;
}

interface AuthState {
    authenticating: boolean;
    user?: User;
    error?: Error;
}

const state = reactive<AuthState>({
    authenticating: false,
    user: undefined,
    error: undefined,
})


// Read access token from local storage?
const token = window.localStorage.getItem(AUTH_KEY)

if ( token ) {
    const { loading, error, data, get } = useApi('/auth/user')

    get({}, token)

    watch([ loading ], () => {
        if ( error.value ) {
            window.localStorage.removeItem(AUTH_KEY)
        }
        else if ( data.value ) {
            state.user = data.value
        }
        console.log(loading.value, error.value, data.value);

    })
}


export const useAuth = () => {
    const setUser = (payload: User, remember: boolean): void => {
        if ( remember ) {
            window.localStorage.setItem(AUTH_KEY, payload[ AUTH_TOKEN ])
        }

        state.user = payload
        state.error = undefined
    }

    const logout = (): Promise<void> => {
        window.localStorage.removeItem(AUTH_KEY)
        return Promise.resolve(state.user = undefined)
    }

    return {
        setUser,
        logout,
        ...toRefs(state),
    }

}