const { groth16 } = require("snarkjs");

async function exportCallDataGroth16(input) {
  const { proof: _proof, publicSignals: _publicSignals } = await groth16.fullProve(input, "./circuits/Cert/cert_js/cert.wasm", "./circuits/Cert/circuit_final.zkey");
  
  const calldata = await groth16.exportSolidityCallData(_proof, _publicSignals);

  //console.log(calldata);

  const argv = calldata.replace(/["[\]\s]/g, "").split(",").map((x) => BigInt(x).toString());

  return argv;
}

module.exports = {
  exportCallDataGroth16,
};
