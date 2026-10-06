import hana from '@sap/hana-client';

export interface SapConnectionOptions {
    serverNode?: string;
    uid?: string;
    pwd?: string;
    currentSchema?: string;
}

export function getSapConfig() {
    const host = process.env.SAP_HANA_HOST || '172.1.2.10';
    const port = process.env.SAP_HANA_PORT || '30015';
    const uid = process.env.SAP_HANA_USER || 'USERBI';
    const pwd = process.env.SAP_HANA_PASSWORD || 'MaraBI2021*';
    const currentSchema = process.env.SAP_HANA_SCHEMA || 'sapabap1';

    return {
        serverNode: `${host}:${port}`,
        uid,
        pwd,
        currentSchema,
        autoReconnect: true
    };
}

export async function executeSapQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const config = getSapConfig();
    const client = hana.createConnection();

    return new Promise((resolve, reject) => {
        client.connect(config, (connectErr) => {
            if (connectErr) {
                console.error('❌ Error conectando a SAP HANA:', connectErr);
                return reject(connectErr);
            }

            client.exec(sql, params, (execErr, rows) => {
                client.disconnect((discErr) => {
                    if (discErr) console.warn('Aviso cerrando conexión SAP:', discErr);
                });

                if (execErr) {
                    console.error('❌ Error ejecutando query en SAP HANA:', execErr);
                    return reject(execErr);
                }

                resolve(rows as T[]);
            });
        });
    });
}
