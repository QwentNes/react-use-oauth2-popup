export type PopupSuccess = {
    google: GoogleProfile,
    discord: DiscordProfile
}

export type PopupError = {
    google: Error,
    discord: Error
}

type GoogleProfile = {
    id: string;
    email: string;
    name: string;
    picture: string;
}

type DiscordProfile = {
    username: string;
    discriminator: string;
    avatar: string;
    verified: boolean;
}

type Error = {
    code: number;
    message: string;
}