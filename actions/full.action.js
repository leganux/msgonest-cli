
const grpc = require('./grpc.action')
const api = require('./api.action')
const gateway = require('./gateway.action')

module.exports = async function ({ path_ }) {
    await grpc({ path_ })
    await gateway({ path_ })
    await api({ path_ })
}