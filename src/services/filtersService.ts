import * as vscode from 'vscode';
import { SEVERITY } from "../constants";
import { ResultsService } from "./resultsService";

export class FiltersService {
    public static severityActiveFiltersState = {
        [SEVERITY.INFO]: false,
        [SEVERITY.LOW]: false,
        [SEVERITY.MEDIUM]: false,
        [SEVERITY.HIGH]: false,
        [SEVERITY.CRITICAL]: false,
        [SEVERITY.UNKNOWN]: false,
    };

    public static applyInfoSeverityFilter() {
        FiltersService.applyGenericSeverityFilter(SEVERITY.INFO);
    }

    public static applyLowSeverityFilter() {
        FiltersService.applyGenericSeverityFilter(SEVERITY.LOW);
    }

    public static applyMediumSeverityFilter() {
        FiltersService.applyGenericSeverityFilter(SEVERITY.MEDIUM);
    }

    public static applyHighSeverityFilter() {
        FiltersService.applyGenericSeverityFilter(SEVERITY.HIGH);
    }

    public static applyCriticalSeverityFilter() {
        FiltersService.applyGenericSeverityFilter(SEVERITY.CRITICAL);
    }

    private static applyGenericSeverityFilter(filterValue: SEVERITY) {
        ResultsService.addFilter({
            filterName: 'severity',
            filterValue,
        });

        const isFilterActive = FiltersService.severityActiveFiltersState[filterValue];
        vscode.commands.executeCommand('setContext', `vscode:is${filterValue}FilterEnabled`, !isFilterActive);
        FiltersService.severityActiveFiltersState[filterValue] = !isFilterActive;
    }
}