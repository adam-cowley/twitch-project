const url = new URL(window.location.href)

export const publicPathTo = (append: string): string => {
    if ( url.protocol.includes('http') ) return `/${append}`

    return `${url.protocol}//${url.pathname.split('/dist/')[0]}/dist/${append}`
}