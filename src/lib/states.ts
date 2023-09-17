/**
 * Update the state
 * @param chain - The chain name
 * @param app - ElysiaJS app object
 */
function changeURL (chain: String, app: any) {
    const nodesToChange = JSON.parse(app.store[`${chain}_nodes`]);
    nodesToChange.push(nodesToChange.shift()); // Moving misbehaving node to end
    app.store[`${chain}_nodes`] = JSON.stringify(nodesToChange);
}

/**
 * Get the current chain node url
 * @param chain 
 * @param app 
 * @returns node url string
 */
function getCurrentNode (chain: String, app: any) {
    const nodes = JSON.parse(app.store[`${chain}_nodes`]);
    return nodes[0].url;
}

export { changeURL, getCurrentNode };