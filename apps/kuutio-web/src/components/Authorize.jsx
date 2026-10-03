// node module imports
import { useEffect, useRef } from 'react'
import Cookies from 'universal-cookie'

// file imports
import authorizeApi from '../api/authorize'
import useStore from '../store'
import { usersWebUrl, domain } from '../config'

import { buttonVariants } from './ui/button'

const Authorize = ({ linkClassName = buttonVariants({ variant: 'outline', size: 'sm' }) }) => {
    const { setUser, user } = useStore()
    const handledKey = useRef(null)

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const user_key  = urlParams.get("user_key")

    const cookies = new Cookies()
    const kuutioToken = cookies.get('kuutioToken')

    useEffect(() => {
        if (user_key) {
          if (handledKey.current === user_key) return
          handledKey.current = user_key
          void getAuthorization()
        } else {
          void loadTokenFromCookies()
        }
    }, [user_key])

    const getAuthorization = async () => {
        try {

        // Exchange the user_key for a token.
        const token = await authorizeApi.getToken(user_key)

        // Save the token as a cookie.
        cookies.set('kuutioToken', token, {
            // Cookie expires in 3 days.
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
            path: '/',
        })

        setUser(await authorizeApi.getUser())

        window.location.href = '/'

        } catch (error) {
          authorizeApi.setToken('')
          cookies.remove('kuutioToken', { path: '/' })
          window.history.replaceState({}, '', '/')
        }
    }

    const loadTokenFromCookies = async () => {
        if (kuutioToken) {

          // Initialize the user state with the token from the cookie.
          authorizeApi.setToken(kuutioToken)

          try {
            // Load user information from the server.
            setUser(await authorizeApi.getUser())

          } catch (error) {
            // If the token is invalid, remove it from the cookie.
            cookies.remove('kuutioToken', { path: '/' })
            authorizeApi.setToken('')
          }
        }
    }

    const logout = async () => {
        await authorizeApi.logout()
        cookies.remove('kuutioToken')
        setUser(null)
    }

    if (user) return (
      <a
        href="/"
        onClick={(event) => { event.preventDefault(); void logout() }}
        className={linkClassName}
      >
        Kirjaudu ulos
      </a>
    )

    return (
      <a
        href={`${usersWebUrl}/?domain=${encodeURIComponent(new URL(domain).host)}`}
        className={linkClassName}
      >Kirjaudu</a>
    )
}

export default Authorize
