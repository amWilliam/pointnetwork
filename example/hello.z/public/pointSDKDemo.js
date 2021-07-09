pointSDKDemo = {
    status: {
        ping: async () => {
            let response = await fetch('/v1/api/status/ping')
            return await response.json()
        }
    },
    wallet: {
        address: async () => {
            let address = await fetch('/v1/api/wallet/address')
            return await address.json()
        },
        balance: async () => {
            let balance = await fetch('/v1/api/wallet/balance')
            return await balance.json()
        },
        hash: async () => {
            let hash = await fetch('/v1/api/wallet/hash')
            return await hash.json()
        },
    },
    contract: {
        call: async (meta) => {
            let response = await fetch('/v1/api/contract/call', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(meta)
            })
            return await response.json()
        },
        send: async (meta) => {
            let response = await fetch('/v1/api/contract/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(meta)
            })
            return await response.json()
        }
    }
}

window.point = pointSDKDemo