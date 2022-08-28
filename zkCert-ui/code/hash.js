const { buildPoseidon } = require("circomlibjs");

async function poseidonHash(input) {
    let poseidon = await buildPoseidon()
    return poseidon.F.toObject(poseidon(input))
}
  
module.exports = {
    poseidonHash,
};