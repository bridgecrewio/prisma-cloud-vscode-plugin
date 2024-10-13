import { close, DataType, define, open } from "ffi-rs";
import * as vscode from "vscode";
import logger from "../logger";
import { mapLibraryName } from "./commonsUtils";

const COMMONS_LIB_NAME = "commons";

export class CommonsClient implements vscode.Disposable {

    private static instance: CommonsClient;

    private commons = define({
        HelloWorld: {
            library: COMMONS_LIB_NAME,
            retType: DataType.Void,
            paramsType: [],
            freeResultMemory: true
        },
        Add: {
            library: COMMONS_LIB_NAME,
            retType: DataType.I32,
            paramsType: [DataType.I32, DataType.I32],
            freeResultMemory: true
        },
        HandleRequest: {
            library: COMMONS_LIB_NAME,
            retType: DataType.String,
            paramsType: [DataType.String],
            freeResultMemory: true
        }
    });

    public static i(): CommonsClient {
        if (!CommonsClient.instance) {
            CommonsClient.instance = new CommonsClient();
        }
        return CommonsClient.instance;
    }

    public init(context: vscode.ExtensionContext) {
        const libPath = context.extensionPath + `/static/lib/lib${mapLibraryName(COMMONS_LIB_NAME)}`;
        logger.info(`Loading plugin-commons from ${libPath}`);
        open({
            library: COMMONS_LIB_NAME,
            path: libPath
        });
        context.subscriptions.push(this);
    }

    public helloWorld() {
        this.commons.HelloWorld([]);
    }

    public add(a: number, b: number) {
        return this.commons.Add([a, b]);
    }

    public handleRequest(request: string) {
        return this.commons.HandleRequest([request]);
    }

    dispose(): any {
        close(COMMONS_LIB_NAME);
    }
}