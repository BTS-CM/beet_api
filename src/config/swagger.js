export const swaggerConfig = {
    documentation: {
        info: {
            title: 'Bitshares BEET API Swagger documentation',
            version: '0.0.1',
            description: 'A Swagger API for the Bitshares BEET API. This API is for local use only.',
            license: {
                name: 'MIT licensed code',
                url: 'https://opensource.org/licenses/MIT'
            },
            contact: {
                name: "Github repository",
                url: "https://github.com/BTS-CM/beet_api"
            }
        },
        tags: [
            { name: 'Beet', description: 'BEET deeplink endpoints' },
            { name: 'Bitshares', description: 'Bitshares data' }
        ],
        externalDocs: {
            description: 'Find out more about the Bitshares BEET multiwallet',
            url: 'https://github.com/bitshares/beet'
        }
    }
}