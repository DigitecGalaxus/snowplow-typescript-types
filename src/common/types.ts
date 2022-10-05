export interface ISchemaDescriptionMeta {
  hidden: boolean;
  schemaType: string;
}

export interface ISchemaDescriptionDeployment {
  version: string;
}

export interface ISchemaDescription {
  hash: string;
  meta: ISchemaDescriptionMeta;
  deployments: ISchemaDescriptionDeployment[];
  vendor: string;
}

export type SnowplowSchemaDescriptions = ISchemaDescription[];

export type SnowplowTokenResponse = {
  message?: string;
  accessToken?: string;
};
