async function getAccountHistory(
    chain: string,
    accountID: string,
    from: number,
    size: number,
    from_date: string,
    to_date: string,
    sort_by: string,
    type: string,
    agg_field: string
) {
    return new Promise(async (resolve, reject) => {
        const url = `https://${chain === "bitshares" ? "api" : "api.testnet"}.bitshares.ws/openexplorer/es/account_history`
            + `?account_id=${accountID}`
            + `&from_=${from ?? 0}`
            + `&size=${size ?? 100}`
            + `&from_date=${from_date ?? "2015-10-10"}`
            + `&to_date=${to_date ?? "now"}`
            + `&sort_by=${sort_by ?? "-operation_id_num"}`
            + `&type=${type ?? "data"}`
            + `&agg_field=${agg_field ?? "operation_type"}`;

        let fetchedHistory;
        try {
            fetchedHistory = await fetch(url, { method: "GET" });
        } catch (error) {
            console.log(error);
            reject(error);
        }

        if (!fetchedHistory || !fetchedHistory.ok) {
            reject(new Error("Couldn't fetch account history"));
            return;
        }

        const history = await fetchedHistory.json();

        if (!history) {
            reject(new Error('Account history not found'));
            return;
        }

        return resolve(history);
    });
}

export {
    getAccountHistory
}