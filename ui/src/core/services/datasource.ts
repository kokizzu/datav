import { DataSourceService, DataSourceApi, DataSourceInstanceSettings, getDataSourceService, getBootConfig, getDefaultDatasourceName, DataSourceSelectItem, getTemplateSrv, localeData, currentLang } from 'src/packages/datav-core/src'
import { importDataSourcePlugin } from 'src/plugins/loader'
import {DataSourceVariableModel} from 'src/types'
import _ from 'lodash'

export class DatasourceSrv implements DataSourceService {
    // cache for datasource plugins
    datasources: Record<string, DataSourceApi> = {}

    constructor() {
        this.init();
    }

    init() {
        this.datasources = {};
    }

    getDataSourceSettingsByUid(uid: string): DataSourceInstanceSettings | undefined {
        return Object.values(getBootConfig().datasources).find(ds => ds.uid === uid)
    }

    get(name?: string): Promise<DataSourceApi> {
        if (!name) {
            name = getDefaultDatasourceName()
        }
        
        if (name === 'default') {
            name = getDefaultDatasourceName()
        }

        if (this.datasources[name]) {
            return Promise.resolve(this.datasources[name])
        }

        return this.loadDatasource(name)
    }

    async loadDatasource(name: string): Promise<DataSourceApi> {
        // check if its in cache now
        if (this.datasources[name]) {
            return this.datasources[name]
        }

        if (!name) {
            const names = _.keys(getBootConfig().datasources)
            if (names.length === 0) {
                return Promise.reject({ message: localeData[currentLang]['datasource.emptyDatasources'] })
            } 

            name = names[0]
        }
        
        let dsConfig
        if (name === "-- Grafana --") {
            dsConfig = {
                id:0,
                uid: "0",
                name: "-- Grafana --",
                type: "grafana",
                isDefault: true,
                meta: {
                    annotations: true,
                    id: "grafana",
                    metrics: true,
                    name:  "-- Grafana --",
                    type: "datasource",
                    module: "src/plugins/built-in/datasource/grafana/module"
                }
            }
        } else {
            dsConfig = getBootConfig().datasources[name]
            if (!dsConfig) {
                return Promise.reject({ message: `Datasource named ${name} was  not found in bootConfig` })
            }
        }

        try {
            const dsPlugin = await importDataSourcePlugin(dsConfig.meta)
            const instance: DataSourceApi = new dsPlugin.DataSourceClass(dsConfig)
            instance.components = dsPlugin.components
            instance.meta = dsConfig.meta

            // store in instance cache
            this.datasources[name] = instance


            return instance
        } catch (err) {
            console.log(err)
            return Promise.reject({ message: `Datasource named ${name} was not found in plugins` })
        }
    }

    getMetricSources(options?: { skipVariables?: boolean }) {
        const metricSources: DataSourceSelectItem[] = [];

        Object.entries(getBootConfig().datasources).forEach(([key, value]) => {
            if (value.meta?.metrics) {
                let metricSource = { value: key, name: key, meta: value.meta, sort: key };

                //Make sure datav and mixed are sorted at the bottom
                if (value.meta.id === 'datav') {
                    metricSource.sort = String.fromCharCode(253);
                } else if (value.meta.id === 'dashboard') {
                    metricSource.sort = String.fromCharCode(254);
                } else if (value.meta.id === 'mixed') {
                    metricSource.sort = String.fromCharCode(255);
                }

                metricSources.push(metricSource);

                if (key === getDefaultDatasourceName()) {
                    metricSource = { value: null, name: 'default', meta: value.meta, sort: key };
                    metricSources.push(metricSource);
                }
            }
        });

        if (!options || !options.skipVariables) {
            this.addDataSourceVariables(metricSources);
        }

        metricSources.sort((a, b) => {
            //@ts-ignore
            if (a.sort.toLowerCase() > b.sort.toLowerCase()) {
                return 1;
            }
            //@ts-ignore
            if (a.sort.toLowerCase() < b.sort.toLowerCase()) {
                return -1;
            }
            return 0;
        });

        return metricSources;
    }
    addDataSourceVariables(list: any[]) {
        // look for data source variables
        getTemplateSrv()
            .getVariables()
            .filter(variable => variable.type === 'datasource')
            .forEach((variable: DataSourceVariableModel) => {
                const first = variable.current.value === 'default' ? getDefaultDatasourceName() : variable.current.value;
                const index = (first as unknown) as string;
                const ds = getBootConfig().datasources[index];

                if (ds) {
                    const key = `$${variable.name}`;
                    list.push({
                        name: key,
                        value: key,
                        meta: ds.meta,
                        sort: key,
                    });
                }
            });
    }
}

export const getDatasourceSrv = (): DatasourceSrv => {
    return getDataSourceService() as DatasourceSrv;
};

export default DatasourceSrv;