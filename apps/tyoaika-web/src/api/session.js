export const readCookie = (name) => {
  const value = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`))
  return value ? decodeURIComponent(value.slice(name.length + 1)) : null
}

export const writeCookie = (name, value) => {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=259200; SameSite=Lax`
}

export const clearCookie = (name) => {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}
