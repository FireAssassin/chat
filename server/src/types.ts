type user = {
    id: string,
    socket: Socket,
    color: string,
}

type color = {
    hex: `#${string}`,
}

export type { user, color }