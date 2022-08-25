import { exportCallDataGroth16 } from "./genCalldata.js";

export async function sudokuCalldata(password, userSalt, appSalt, grade, nonce, pathIndices, siblings, nullifier, minGrade) {
    const INPUT = {
        password: password,
        userSalt: userSalt,
        appSalt: appSalt,
        grade: grade,
        nonce: nonce,
        treePathIndices: pathIndices,
        treeSiblings: siblings,
        nullifier: nullifier,
        minGrade: minGrade           
    };

    let dataResult;

    try {
        dataResult = await exportCallDataGroth16(INPUT);
    } catch (error) {
        // console.log(error);
        window.alert("Wrong input");
    }

    return dataResult;
}