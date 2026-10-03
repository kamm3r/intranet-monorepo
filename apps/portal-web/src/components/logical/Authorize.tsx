// node module imports
import { useEffect, useRef, type CSSProperties } from 'react'
import Cookies from 'universal-cookie'

// file imports
import authorizeApi from '../../api/authorize'
import useStore from '../../store'
import { usersWebUrl, domain } from '../../config'

type AuthorizeProps = {
    linkStyle?: CSSProperties
    linkClassName?: string
}

const Authorize = (props: AuthorizeProps) => {
    const { setUser, user } = useStore()
    const initialized = useRef(false)
    
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const user_key: string | null  = urlParams.get("user_key")

    const cookies = new Cookies()

    useEffect(() => {
        // React StrictMode replays effects in development. A one-time SSO key
        // must only be exchanged once for this page load.
        if (initialized.current) return
        initialized.current = true
        if (user_key) getAuthorization()
        else loadTokenFromCookies()
    }, [])

    const getAuthorization = async () => {
        try {
        
        // Exchange the user_key for a token.
        const token = await authorizeApi.getToken(user_key)
        
        // Save the token as a cookie.
        cookies.set('portalToken', token, {
            // Cookie expires in 3 days.
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
            path: '/',
        })

        setUser(await authorizeApi.getUser())

        window.location.href = '/'

        } catch (error) { console.log(error) }
    }

    const loadTokenFromCookies = async () => {
        const portalToken = cookies.get('portalToken')
    
        if (portalToken) {
    
          // Initialize the user state with the token from the cookie.
          authorizeApi.setToken(portalToken)
    
          try {
            // Load user information from the server.
            setUser(await authorizeApi.getUser())
          
          } catch (error) {
            // If the token is invalid, remove it from the cookie.
            cookies.remove('portalToken')
          }
        }
    }

    const logout = async () => {
        try { await authorizeApi.logout() } catch { /* Clear the local session anyway. */ }
        cookies.remove('portalToken')
        setUser(null)
    }

    if (user) return (
      <a
        href="/"
        onClick={(event) => { event.preventDefault(); void logout() }}
        style={props.linkStyle}
        className={props.linkClassName}
      >Kirjaudu ulos</a>
    )
    
    return (
      <a
        href={`${usersWebUrl}/?domain=${encodeURIComponent(new URL(domain).host)}`}
        style={props.linkStyle}
        className={props.linkClassName}
      >Kirjaudu</a>
    )
}

export default Authorize
