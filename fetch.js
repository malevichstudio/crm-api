import fetch from 'node-fetch';
import getSyncModel from "../getSyncModel";
import Raven from "raven";

module.exports = async id => {
    const sync = await getSyncModel('order', 'prom');
    const response = await fetch(`${sync.Source.domain}/api/v1/orders/${id}`, {
        headers: {
            "Authorization": `Bearer ${sync.Source.account}`,
            "Content-Type": "application/json"
        }
    });

    if (response.status !== 200) {
        Raven.captureException(new Error('Bad response'), {
            extra: {
                error: response.body.error,
                status: response.status,
                statusText: response.statusText,
            },
        });
        return;
    }

    return response.json(null).catch(e => Raven.captureException(e));
};