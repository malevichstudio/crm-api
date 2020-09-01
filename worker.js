import models from '../models';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import Raven from "raven";
import config from "../config/config";

const basename  = path.basename(__filename);

const getWorkers = async () => {
    const sources = await models.Source.findAll({
        raw: true,
        where: {
            sync: true,
        },
        attributes: ['key'],
    });
    return _.flatten(sources.map(source => {
        return fs
            .readdirSync(__dirname + '/' + source.key)
            .filter(file => {
                return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
            })
            .map(file => {
                return require(path.join(__dirname + '/' + source.key, file));
            });
    }));
};

const runWorkers = async () => {
    const workers = await getWorkers();

    if (workers.length) {
        let i = 0;
        for (const worker of workers) {
            console.log(`${getDateTime()} Run sync worker ${i}`);
            try {
                await worker();
            } catch (e) {
                Raven.captureException(e);
            }
            i++;
        }
    }

    console.log(`${getDateTime()} Waiting ${config.workersTimeout} sec`);
    setTimeout(runWorkers, config.workersTimeout * 1000);
};

const getDateTime = () => {
    const date = new Date();
    const yyyy = date.getFullYear();
    let mm = date.getMonth() + 1;
    let dd = date.getDate();
    let hh = date.getHours();
    let ii = date.getMinutes();

    if (mm < 10) {
        mm = `0${mm}`;
    }
    if (dd < 10) {
        dd = `0${dd}`;
    }
    if (hh < 10) {
        hh = `0${hh}`;
    }
    if (ii < 10) {
        ii = `0${ii}`;
    }

    return `[${dd}.${mm}.${yyyy} ${hh}:${ii}]`;
};

runWorkers().catch(e => {
    Raven.captureException(e);
    setTimeout(runWorkers, config.workersTimeout * 1000);
});
