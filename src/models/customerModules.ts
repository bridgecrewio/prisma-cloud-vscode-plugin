export interface CustomerModulesResponse {
    modules: CustomerModules
}

export interface CustomerModules {
    CICD: boolean,
    IAC: boolean,
    SAST: boolean,
    SCA: boolean,
    SECRETS: boolean
}
